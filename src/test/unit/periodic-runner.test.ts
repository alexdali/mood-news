import { describe, expect, it } from "vitest";
import { runPeriodicTask } from "@/modules/jobs/periodic-runner";

describe("periodic task runner", () => {
  it("subtracts task duration from its own cadence", async () => {
    let clock = 0;
    let runs = 0;
    let stopping = false;
    const waits: number[] = [];

    await runPeriodicTask(async () => {
      runs += 1;
      clock += 200;
      if (runs === 2) stopping = true;
    }, {
      intervalMs: 1_000,
      initialDelayMs: 100,
      minimumDelayMs: 1,
      isStopping: () => stopping,
      now: () => clock,
      wait: async (timeoutMs) => {
        waits.push(timeoutMs);
        clock += timeoutMs;
      },
    });

    expect(runs).toBe(2);
    expect(waits).toEqual([100, 800]);
  });

  it("does not run after a stop requested during initial delay", async () => {
    let stopping = false;
    let runs = 0;

    await runPeriodicTask(async () => { runs += 1; }, {
      intervalMs: 1_000,
      initialDelayMs: 50,
      isStopping: () => stopping,
      wait: async () => { stopping = true; },
    });

    expect(runs).toBe(0);
  });
});
