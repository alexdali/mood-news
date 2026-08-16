import { describe, expect, it } from "vitest";
import { nextIngestionAt } from "@/modules/ops/summary-service";

describe("operations ingestion schedule", () => {
  it("schedules the next source poll from the previous start time", () => {
    expect(nextIngestionAt("2026-08-16T21:02:02.316Z", 300_000))
      .toBe("2026-08-16T21:07:02.316Z");
  });
});
