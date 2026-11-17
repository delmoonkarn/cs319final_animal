import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * Shared Prisma client for the whole server (Prisma 7 + the node-postgres driver adapter).
 * Queries go through DATABASE_URL (Supabase transaction pooler, port 6543).
 *
 * Connections to Supabase are encrypted with TLS; a local database (e.g. localhost) is not.
 */
const databaseHost = new URL(env.DATABASE_URL).hostname;
const isSupabase = /\.supabase\.(co|com)$/.test(databaseHost);

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});

/**
 * `passwordHash` is omitted from every User query by default, so it can never end up in a
 * response by accident (including nested includes). The one place that needs it (login)
 * opts back in explicitly with `omit: { passwordHash: false }`.
 */
export const prisma = new PrismaClient({
  adapter,
  omit: {
    user: { passwordHash: true },
  },
});
