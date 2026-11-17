import { z } from "zod";

/** String field with "<Label> is required" / "<Label> must be text" messages instead of zod's defaults. */
export function stringField(label: string) {
  return z.string({
    error: (issue) => (issue.input === undefined || issue.input === null ? `${label} is required` : `${label} must be text`),
  });
}

/** Required text: trimmed, not empty, limited length. */
export function textField(label: string, max: number) {
  return stringField(label)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
}

/** Wraps a body schema so a missing/non-object body gives a clear message. */
export function bodySchema<Shape extends z.ZodRawShape>(shape: Shape) {
  return z.object(shape, { error: "Request body must be a JSON object" });
}

/** `:id` route parameter → positive integer. */
export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "id must be a number" })
    .int("id must be a whole number")
    .positive("id must be a positive number"),
});
