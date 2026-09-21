import { describe, expect, it, vi } from "vitest";
import { ClassroomApiError, ClassroomClient } from "../src/classroom/client.js";
describe("ClassroomClient", () => {
  it("follows page tokens", async () => {
    const request = vi.fn();
    request.mockResolvedValueOnce(new Response(JSON.stringify({ courses: [{ id: "1", name: "A", courseState: "ACTIVE" }], nextPageToken: "next" })));
    request.mockResolvedValueOnce(new Response(JSON.stringify({ courses: [{ id: "2", name: "B", courseState: "ACTIVE" }]})));
    const result = await new ClassroomClient("token", request).listCourses();
    expect(result.map((x) => x.id)).toEqual(["1", "2"]);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("maps permission failures to an actionable error", async () => { const client = new ClassroomClient("token", vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }))); await expect(client.listCourses()).rejects.toMatchObject({ code: "PERMISSION", status: 403 }); });
});
