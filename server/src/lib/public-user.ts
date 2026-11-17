import type { Prisma } from "@prisma/client";

/** User fields that are safe to send to clients. `passwordHash` is deliberately not here. */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

/**
 * Copies only the public fields, dropping anything else (e.g. a `passwordHash` that a login
 * query loaded). Use `select: publicUserSelect` in queries whenever possible; use this when a
 * full record had to be loaded first.
 */
export function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}
