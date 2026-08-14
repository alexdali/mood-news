export function parseBoundedInteger(
  value: string | null | undefined,
  options: { fallback: number; min: number; max: number },
): number {
  if (value === null || value === undefined || value.trim() === "") return options.fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return options.fallback;
  return Math.min(Math.max(Math.trunc(parsed), options.min), options.max);
}
