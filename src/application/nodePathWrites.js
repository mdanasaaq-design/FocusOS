import { chunkNodePathWrites } from "../domain/nodeTree.js";

/**
 * Commit path updates sequentially in Firestore-safe chunks.
 *
 * The commit adapter is injected so a failed later chunk can be tested without
 * Firebase credentials. If a chunk fails, the error is propagated immediately;
 * callers can re-read persisted nodes, re-plan stale paths, and retry safely.
 */
export async function commitNodePathWriteChunks(writes, commitChunk, chunkSize = 450) {
  if (typeof commitChunk !== "function") {
    throw new Error("commitNodePathWriteChunks: commitChunk must be a function.");
  }
  const chunks = chunkNodePathWrites(writes, chunkSize);
  for (const chunk of chunks) {
    await commitChunk(chunk);
  }
  return writes.length;
}
