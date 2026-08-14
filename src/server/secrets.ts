import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function secureStringEquals(left: string | null | undefined, right: string): boolean {
  if (!left) return false;
  return timingSafeEqual(digest(left), digest(right));
}
