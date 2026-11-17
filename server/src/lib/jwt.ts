import { Role } from "@prisma/client";
import { JsonWebTokenError, sign, verify, type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "./env";

const tokenPayloadSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(Role),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export function signToken(payload: TokenPayload): string {
  return sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    // Format is validated in env.ts (e.g. "7d"); jsonwebtoken types it as a template-literal string.
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

/** Verifies signature + expiry and checks the payload shape. Throws jsonwebtoken errors (→ 401). */
export function verifyToken(token: string): TokenPayload {
  const decoded = verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  const parsed = tokenPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new JsonWebTokenError("invalid token payload");
  }
  return parsed.data;
}
