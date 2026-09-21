import { describe, expect, it } from "vitest";
import { SlidingWindowLimiter } from "../src/api/rate-limit.js";
describe("rate limiting", () => { it("enforces a window and permits traffic after expiry", () => { let now = 0; const limiter = new SlidingWindowLimiter(2, 1000, () => now); expect(limiter.allow("u")).toBe(true); expect(limiter.allow("u")).toBe(true); expect(limiter.allow("u")).toBe(false); now = 1001; expect(limiter.allow("u")).toBe(true); }); });
