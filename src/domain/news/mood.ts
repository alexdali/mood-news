export const moods = ["neutral", "hopeful", "concerned", "ironic"] as const;
export type Mood = (typeof moods)[number];

export function isMood(value: unknown): value is Mood {
  return typeof value === "string" && moods.includes(value as Mood);
}
