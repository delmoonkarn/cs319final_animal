import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const required = () => z.string({ error: "is required" }).trim().min(1, "is required");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Allowed browser origin(s) for CORS; comma-separate several (e.g. local + deployed client). */
  CLIENT_URL: z.string().trim().min(1).default("http://localhost:5173"),

  DATABASE_URL: required(),

  JWT_SECRET: required().min(32, "must be at least 32 characters (see README for how to generate one)"),
  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+(s|m|h|d|w|y)$/, 'must be a number followed by a unit, e.g. "7d", "12h" or "30m"')
    .default("7d"),

  SUPABASE_URL: z.url("must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: required(),
  SUPABASE_BUCKET: required(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Only variable names and rule messages are printed, never the values themselves.
  console.error("Invalid environment variables (check server/.env):");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")} ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CLIENT_ORIGINS: parsed.data.CLIENT_URL.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
};
