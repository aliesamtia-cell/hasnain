import { randomBytes } from "node:crypto";

const SAFE = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%";

export function generatePassword(length = 16): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SAFE[bytes[i]! % SAFE.length];
  }
  return out;
}
