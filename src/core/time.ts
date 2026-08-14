export function nowIso(): string {
  return new Date().toISOString();
}

export function toIso(value: string | number | Date | undefined, fallback = nowIso()): string {
  if (value === undefined) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

export function addMilliseconds(iso: string, milliseconds: number): string {
  return new Date(new Date(iso).getTime() + milliseconds).toISOString();
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
