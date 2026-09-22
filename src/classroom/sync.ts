import type { Repository, Coursework } from "../shared/types.js";
import type { ClassroomClient } from "./client.js";

const dueAt = (date?: { year: number; month: number; day: number }, time?: { hours?: number; minutes?: number; seconds?: number }) => date ? new Date(Date.UTC(date.year, date.month - 1, date.day, time?.hours ?? 23, time?.minutes ?? 59, time?.seconds ?? 59)).toISOString() : undefined;
/** Reads only published coursework available to the user and writes an idempotent local projection. */
export async function syncClassroom(userId: string, client: Pick<ClassroomClient, "listCourses" | "listCourseWork">, repo: Pick<Repository, "upsertCoursework">) {
  const courses = await client.listCourses(); const items: Coursework[] = [];
  for (const course of courses.filter((item) => item.courseState === "ACTIVE")) for (const work of await client.listCourseWork(course.id)) {
    if (work.state !== "PUBLISHED") continue;
    items.push({ id: `${course.id}:${work.id}`, userId, courseId: course.id, courseworkId: work.id, title: work.title, dueAt: dueAt(work.dueDate, work.dueTime), state: work.state, updatedAt: work.updateTime ?? new Date(0).toISOString() });
  }
  await repo.upsertCoursework(items); return { courses: courses.length, coursework: items.length };
}
