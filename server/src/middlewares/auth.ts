import { Role } from "@prisma/client";
import type { Request, RequestHandler } from "express";
import { HttpError } from "../lib/http-error";
import { verifyToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { publicUserSelect, type PublicUser } from "../lib/public-user";

function extractBearerToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header) {
    throw new HttpError(401, "Authentication required");
  }
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) {
    throw new HttpError(401, 'Authorization header must be "Bearer <token>"');
  }
  return match[1];
}

/**
 * Verifies the token, then loads the user from the database so deleted accounts and role
 * changes take effect immediately (and tokens from before a re-seed are rejected cleanly).
 */
async function authenticate(req: Request): Promise<PublicUser> {
  const { userId } = verifyToken(extractBearerToken(req));
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) {
    throw new HttpError(401, "This account no longer exists, please log in again");
  }
  return user;
}

/** Requires a valid `Authorization: Bearer <token>` header and sets `req.user`. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  req.user = await authenticate(req);
  next();
};

/** Same as `requireAuth`, plus the user must be an ADMIN (403 otherwise). */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  const user = await authenticate(req);
  if (user.role !== Role.ADMIN) {
    throw new HttpError(403, "Admin access required");
  }
  req.user = user;
  next();
};

/** Returns `req.user` in handlers that run after `requireAuth` / `requireAdmin`. */
export function getAuthUser(req: Request): PublicUser {
  if (!req.user) {
    throw new HttpError(401, "Authentication required");
  }
  return req.user;
}
