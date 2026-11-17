import { compare, hash, hashSync } from "bcrypt";
import { randomBytes } from "node:crypto";

const SALT_ROUNDS = 10;

/** bcrypt only uses the first 72 bytes of a password, so longer ones are rejected by validation. */
export const MAX_PASSWORD_BYTES = 72;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}

/**
 * Hash of a random throwaway password. Login compares against it when the email is unknown,
 * so the response time doesn't reveal whether an account exists.
 */
export const DUMMY_PASSWORD_HASH = hashSync(randomBytes(16).toString("hex"), SALT_ROUNDS);
