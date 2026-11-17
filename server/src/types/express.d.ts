import type { PublicUser } from "../lib/public-user";

declare global {
  namespace Express {
    interface Request {
      /** The signed-in user; set by `requireAuth` / `requireAdmin`. */
      user?: PublicUser;
    }
  }
}

export {};
