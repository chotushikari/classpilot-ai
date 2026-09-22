import type { AssignmentWatcher } from "./assignment-watcher.js";

export interface WatchTarget { userId: string; enabled: boolean; }
export interface SchedulerState { userId: string; nextRunAt: number; attempts: number; leaseUntil?: number; }
export interface SchedulerStore { listTargets(): Promise<WatchTarget[]>; claim(userId: string, now: number, leaseMs: number): Promise<boolean>; recordSuccess(userId: string, now: number, intervalMs: number): Promise<void>; recordFailure(userId: string, now: number, retryMs: number): Promise<void>; }

export class WatchScheduler {
  constructor(private readonly watcher: Pick<AssignmentWatcher, "scan">, private readonly store: SchedulerStore, private readonly intervalMs = 5 * 60_000, private readonly leaseMs = 2 * 60_000, private readonly now = Date.now) {}
  async tick() {
    const now = this.now(); const targets = await this.store.listTargets(); const results: Array<{ userId: string; status: "success" | "failed" | "leased" }> = [];
    for (const target of targets) {
      if (!target.enabled || !(await this.store.claim(target.userId, now, this.leaseMs))) { results.push({ userId: target.userId, status: "leased" }); continue; }
      try { await this.watcher.scan(target.userId); await this.store.recordSuccess(target.userId, now, this.intervalMs); results.push({ userId: target.userId, status: "success" }); }
      catch { await this.store.recordFailure(target.userId, now, Math.min(this.intervalMs, 1_000 * 2 ** 3)); results.push({ userId: target.userId, status: "failed" }); }
    }
    return results;
  }
}
