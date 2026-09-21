import { describe, expect, it } from "vitest";
import { routeCapabilities } from "../src/engine/capability-router.js";
import { retryDelay, transition } from "../src/engine/state-machine.js";
describe("durable workflow controls", () => {
  it("allows only declared state transitions", () => { expect(transition("DETECTED", "INGESTING")).toBe("INGESTING"); expect(() => transition("DETECTED", "READY_FOR_REVIEW")).toThrow(/Invalid/); });
  it("uses bounded exponential retry delay", () => { expect(retryDelay(1)).toBe(1000); expect(retryDelay(5)).toBe(16000); expect(() => retryDelay(6)).toThrow(); });
  it("reports missing capabilities without model confidence", () => { expect(routeCapabilities(["document_parse", "artifact_pdf"], new Set(["artifact_pdf"]))).toMatchObject({ status: "recoverable", missingCapabilities: ["document_parse"] }); expect(routeCapabilities(["drive_upload"], new Set()).status).toBe("blocked"); });
});
