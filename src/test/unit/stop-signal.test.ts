import { afterEach, describe, expect, it, vi } from "vitest";
import { StopSignal } from "@/core/stop-signal";

afterEach(() => vi.useRealTimers());

describe("StopSignal", () => {
  it("releases pending waits immediately after a stop request", async () => {
    vi.useFakeTimers();
    const signal = new StopSignal();
    let resolved = false;
    const pending = signal.wait(60_000).then(() => { resolved = true; });

    signal.request();
    await pending;

    expect(signal.isRequested()).toBe(true);
    expect(resolved).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("returns immediately for waits registered after stop", async () => {
    const signal = new StopSignal();
    signal.request();
    await expect(signal.wait(60_000)).resolves.toBeUndefined();
  });
});
