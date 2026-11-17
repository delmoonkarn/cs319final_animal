import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";
import { MAX_FILES_PER_REQUEST, MAX_FILE_SIZE_MB, UPLOAD_FIELD_NAME } from "./upload";

type FieldError = { field: string; message: string };
type ErrorBody = { message: string; errors?: FieldError[] };
type ErrorResponse = { status: number; body: ErrorBody };

/** Fallback for unknown routes (mounted after all routers). */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler: every error becomes JSON `{ message }` with a fitting status code. */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  const { status, body } = toErrorResponse(err);
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }
  res.status(status).json(body);
}

function toErrorResponse(err: unknown): ErrorResponse {
  if (err instanceof HttpError) {
    return { status: err.status, body: { message: err.message } };
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join(".") : "body",
      message: issue.message,
    }));
    return { status: 400, body: { message: errors.map((e) => e.message).join(", "), errors } };
  }

  if (err instanceof multer.MulterError) {
    return { status: 400, body: { message: multerMessage(err) } };
  }

  // TokenExpiredError extends JsonWebTokenError, so check it first.
  if (err instanceof TokenExpiredError) {
    return { status: 401, body: { message: "Your session has expired, please log in again" } };
  }
  if (err instanceof JsonWebTokenError) {
    return { status: 401, body: { message: "Invalid authentication token" } };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return { status: 409, body: { message: uniqueViolationMessage(err) } };
      case "P2025":
        return { status: 404, body: { message: "Record not found" } };
      case "P2003":
        return { status: 400, body: { message: "A referenced record does not exist" } };
    }
  }

  if (isBodyParserError(err)) {
    if (err.type === "entity.parse.failed") {
      return { status: 400, body: { message: "Request body is not valid JSON" } };
    }
    if (err.status === 413) {
      return { status: 413, body: { message: "Request body is too large" } };
    }
    return { status: err.status, body: { message: "Invalid request body" } };
  }

  return { status: 500, body: { message: "Internal server error" } };
}

function multerMessage(err: multer.MulterError): string {
  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      return `Each image must be ${MAX_FILE_SIZE_MB}MB or smaller`;
    case "LIMIT_FILE_COUNT":
      return `You can upload at most ${MAX_FILES_PER_REQUEST} images per request`;
    case "LIMIT_UNEXPECTED_FILE":
      return err.field === UPLOAD_FIELD_NAME
        ? `You can upload at most ${MAX_FILES_PER_REQUEST} images per request`
        : `Unexpected file field "${err.field ?? ""}", send images in the "${UPLOAD_FIELD_NAME}" field`;
    default:
      return err.message;
  }
}

function uniqueViolationMessage(err: Prisma.PrismaClientKnownRequestError): string {
  const fields = uniqueFields(err.meta);
  return fields ? `A record with this ${fields} already exists` : "This record already exists";
}

/**
 * Field names from a P2002 error. With the pg driver adapter (Prisma 7) they come from the
 * violated index, which Prisma names "<Model>_<field>[_<field>]_key" (e.g. "User_email_key").
 */
function uniqueFields(meta: Record<string, unknown> | undefined): string | undefined {
  const target = meta?.target;
  if (isStringArray(target)) return target.join(", ");
  if (typeof target === "string") return target;

  const constraint = getPath(meta, ["driverAdapterError", "cause", "constraint"]);
  const fields = getPath(constraint, ["fields"]);
  if (isStringArray(fields)) return fields.join(", ");

  const index = getPath(constraint, ["index"]);
  const model = meta?.modelName;
  if (typeof index === "string" && typeof model === "string") {
    const match = new RegExp(`^${model}_(.+)_key$`).exec(index);
    if (match) return match[1].split("_").join(", ");
  }
  return undefined;
}

/** Safely reads a nested property from an unknown value. */
function getPath(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === "string");
}

/** Errors raised by express.json() (body-parser) carry `type` and a 4xx `status`. */
function isBodyParserError(err: unknown): err is Error & { type: string; status: number } {
  return (
    err instanceof Error &&
    "type" in err &&
    typeof err.type === "string" &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  );
}
