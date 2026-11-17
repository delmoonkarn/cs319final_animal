import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env by itself, so load it here for the Prisma CLI.
dotenv.config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Run by `npm run db:seed` (prisma db seed)
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma Migrate connects through the Supabase session pooler / direct connection (port 5432).
    // Read with process.env (not env()) so `prisma generate` also works before .env exists.
    url: process.env.DIRECT_URL,
  },
});
