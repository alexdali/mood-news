export function heading(value: string): void {
  console.log(`\n=== ${value} ===`);
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function fail(error: unknown): never {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
}
