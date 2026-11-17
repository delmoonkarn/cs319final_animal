import { Role } from "@prisma/client";
import type { Request, Response } from "express";
import { HttpError } from "../lib/http-error";
import { signToken } from "../lib/jwt";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "../lib/password";
import { prisma } from "../lib/prisma";
import { publicUserSelect, toPublicUser, type PublicUser } from "../lib/public-user";
import { getAuthUser } from "../middlewares/auth";
import { loginSchema, registerSchema } from "../validators/auth.validator";

type AuthResponse = { token: string; user: PublicUser };

function buildAuthResponse(user: PublicUser): AuthResponse {
  return { token: signToken({ userId: user.id, role: user.role }), user };
}

/** POST /api/auth/register — always creates a USER account. */
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, phone, password } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new HttpError(409, "This email is already registered");
  }

  // A concurrent duplicate still fails on the unique index (P2002 → 409 in the error handler).
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash: await hashPassword(password), role: Role.USER },
    select: publicUserSelect,
  });

  res.status(201).json(buildAuthResponse(user));
}

/** POST /api/auth/login — one generic 401 for unknown email and wrong password alike. */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    omit: { passwordHash: false },
  });

  // Run bcrypt even when the email is unknown so timing doesn't reveal which emails exist.
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  res.json(buildAuthResponse(toPublicUser(user)));
}

/** GET /api/auth/me */
export function me(req: Request, res: Response): void {
  res.json({ user: getAuthUser(req) });
}
