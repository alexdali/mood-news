/**
 * Small process-local cancellation primitive for long-running workers.
 * Unlike Promise.race with a plain timer, wait() clears the timer when a stop
 * request arrives, so SIGTERM does not leave the process alive until timeout.
 */
export class StopSignal {
  private stopped = false;
  private readonly listeners = new Set<() => void>();

  request(): void {
    if (this.stopped) return;
    this.stopped = true;
    for (const listener of this.listeners) listener();
    this.listeners.clear();
  }

  isRequested(): boolean {
    return this.stopped;
  }

  async wait(timeoutMs: number): Promise<void> {
    if (this.stopped || timeoutMs <= 0) return;
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.listeners.delete(finish);
        resolve();
      };
      const timer = setTimeout(finish, timeoutMs);
      this.listeners.add(finish);
    });
  }
}
