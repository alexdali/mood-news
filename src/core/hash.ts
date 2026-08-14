import { createHash } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function articleContentHash(input: {
  title: string;
  summary: string;
  publishedAt: string;
}): string {
  return sha256(`${input.title}\n${input.summary}\n${input.publishedAt}`);
}
