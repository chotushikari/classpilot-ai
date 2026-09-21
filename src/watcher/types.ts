export interface ObservedAssignment {
  courseId: string;
  courseworkId: string;
  title: string;
  state: string;
  updatedAt?: string;
  dueAt?: string;
}

export interface AssignmentSource { listAssignments(userId: string): Promise<ObservedAssignment[]>; }
export interface Snapshot { fingerprint: string; updatedAt?: string; }
export interface WatcherStore {
  getSnapshot(userId: string, assignment: ObservedAssignment): Promise<Snapshot | undefined>;
  saveSnapshot(userId: string, assignment: ObservedAssignment, snapshot: Snapshot): Promise<void>;
  enqueue(userId: string, assignment: ObservedAssignment, idempotencyKey: string, priority: number): Promise<void>;
}
