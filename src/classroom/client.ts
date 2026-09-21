export interface ClassroomCourse { id: string; name: string; courseState: string; updateTime?: string; }
export interface ClassroomWork { id: string; courseId: string; title: string; description?: string; state: string; updateTime?: string; dueDate?: { year: number; month: number; day: number }; dueTime?: { hours?: number; minutes?: number; seconds?: number }; materials?: unknown[]; }
export class ClassroomApiError extends Error { constructor(public readonly status: number, public readonly code: "AUTH" | "RATE_LIMIT" | "TRANSIENT" | "PERMISSION" | "INVALID", message: string) { super(message); } }
type FetchLike = typeof fetch;
export class ClassroomClient {
  constructor(private readonly accessToken: string, private readonly request: FetchLike = fetch) {}
  private async list<T>(path: string, key: string): Promise<T[]> { const values: T[] = []; let pageToken: string | undefined; for (;;) { const url = new URL(`https://classroom.googleapis.com/v1/${path}`); url.searchParams.set("pageSize", "100"); if (pageToken) url.searchParams.set("pageToken", pageToken); const response = await this.request(url, { headers: { Authorization: `Bearer ${this.accessToken}` } }); if (!response.ok) { const text = await response.text(); const code = response.status === 401 ? "AUTH" : response.status === 403 ? "PERMISSION" : response.status === 429 ? "RATE_LIMIT" : response.status >= 500 ? "TRANSIENT" : "INVALID"; throw new ClassroomApiError(response.status, code, text.slice(0, 500)); } const body = await response.json() as Record<string, unknown>; values.push(...((body[key] as T[] | undefined) ?? [])); pageToken = typeof body.nextPageToken === "string" ? body.nextPageToken : undefined; if (!pageToken) return values; } }
  listCourses() { return this.list<ClassroomCourse>("courses?courseStates=ACTIVE", "courses"); }
  listCourseWork(courseId: string) { return this.list<ClassroomWork>(`courses/${encodeURIComponent(courseId)}/courseWork`, "courseWork"); }
}
