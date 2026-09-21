export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>();
  constructor(private readonly limit: number, private readonly windowMs: number, private readonly now: () => number = Date.now) {}
  allow(key: string) { const cutoff = this.now() - this.windowMs; const active = (this.hits.get(key) ?? []).filter((time) => time > cutoff); if (active.length >= this.limit) { this.hits.set(key, active); return false; } active.push(this.now()); this.hits.set(key, active); return true; }
}
