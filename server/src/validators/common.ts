import { z } from "zod";

/** String field with "<Label> is required" / "<Label> must be text" messages instead of zod's defaults. */
export function stringField(label: string) {
  return z.string({
    error: (issue) => (issue.input === undefined || issue.input === null ? `${label} is required` : `${label} must be text`),
  });
}

/** Wraps a body schema so a missing/non-object body gives a clear message. */
export function bodySchema<Shape extends z.ZodRawShape>(shape: Shape) {
  return z.object(shape, { error: "Request body must be a JSON object" });
}
