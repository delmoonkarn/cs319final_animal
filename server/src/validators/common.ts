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

/** Optional short text: missing, null or "" all become null. */
export function optionalTextField(label: string, max: number) {
  return stringField(label)
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();
}

/** A list of image URLs (from POST /api/uploads): min–max items, http(s), no duplicates. */
export function imageUrlsField(min: number, max: number) {
  return z
    .array(z.url({ protocol: /^https?$/, error: "Each image must be a valid http(s) URL" }), {
      error: "imageUrls must be an array of image URLs",
    })
    .min(min, `Add at least ${min} image${min === 1 ? "" : "s"}`)
    .max(max, `Add at most ${max} images`)
    .refine((urls) => new Set(urls).size === urls.length, { error: "The same image is listed twice" });
}

/** A single http(s) URL, e.g. a payment slip uploaded through POST /api/uploads. */
export function urlField(label: string) {
  return z.url({ protocol: /^https?$/, error: `${label} must be a valid http(s) URL` });
}

/** Wraps a body schema so a missing/non-object body gives a clear message. */
export function bodySchema<Shape extends z.ZodRawShape>(shape: Shape) {
  return z.object(shape, { error: "Request body must be a JSON object" });
}

/** Positive integer id from a URL (route parameter or query string, so the text is converted). */
export function idFromUrl(label: string) {
  return z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .positive(`${label} must be a positive number`);
}

/** Positive integer id inside a JSON body (must already be a number). */
export function idInBody(label: string) {
  return z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .positive(`${label} must be a positive number`);
}

/** `:id` route parameter → positive integer. */
export const idParamSchema = z.object({ id: idFromUrl("id") });

/** `?page=&pageSize=` for paginated lists. */
export const paginationQuery = {
  page: z.coerce
    .number({ error: "page must be a number" })
    .int("page must be a whole number")
    .min(1, "page must be at least 1")
    .default(1),
  pageSize: z.coerce
    .number({ error: "pageSize must be a number" })
    .int("pageSize must be a whole number")
    .min(1, "pageSize must be at least 1")
    .max(50, "pageSize must be at most 50")
    .default(12),
};
