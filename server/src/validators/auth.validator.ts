import { z } from "zod";
import { MAX_PASSWORD_BYTES } from "../lib/password";
import { bodySchema, stringField } from "./common";

const emailField = stringField("Email")
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .pipe(z.email("Email must be a valid email address"));

export const registerSchema = bodySchema({
  name: stringField("Name").trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  email: emailField,
  phone: stringField("Phone")
    .trim()
    .min(1, "Phone is required")
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^0\d{8,9}$/, "Phone must be a Thai phone number, e.g. 0812345678")),
  password: stringField("Password")
    .min(8, "Password must be at least 8 characters")
    .refine((value) => Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES, {
      error: `Password must be at most ${MAX_PASSWORD_BYTES} bytes`,
    }),
});

export const loginSchema = bodySchema({
  email: emailField,
  password: stringField("Password").min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
