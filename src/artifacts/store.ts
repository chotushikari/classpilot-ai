import type { GeneratedFile } from "./generators.js";

export interface StoredArtifact { userId: string; jobId: string; filename: string; mimeType: string; bytes: Buffer; createdAt: string; }
export interface ArtifactStore { put(userId: string, jobId: string, file: GeneratedFile): Promise<StoredArtifact>; get(userId: string, jobId: string, filename: string): Promise<StoredArtifact | undefined>; }

/** Local/demo store. Production should replace this with encrypted object storage. */
export class MemoryArtifactStore implements ArtifactStore {
  private readonly files = new Map<string, StoredArtifact>();
  async put(userId: string, jobId: string, file: GeneratedFile) { const stored = { userId, jobId, filename: file.filename, mimeType: file.mimeType, bytes: file.bytes, createdAt: new Date().toISOString() }; this.files.set(this.key(userId, jobId, file.filename), stored); return stored; }
  async get(userId: string, jobId: string, filename: string) { return this.files.get(this.key(userId, jobId, filename)); }
  private key(userId: string, jobId: string, filename: string) { return `${userId}:${jobId}:${filename}`; }
}
export const artifactStore = new MemoryArtifactStore();
