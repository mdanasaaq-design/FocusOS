// In-memory stand-in for the subset of "firebase/firestore" used by the Page
// and Node data layers. It exists so lifecycle tests can run the REAL data-layer
// functions (src/data/pages.js, src/data/nodes.js) without the Firebase
// emulator, and so a batch commit can be made to fail deterministically.
//
// Fidelity notes (this is a fixture, not Firestore):
// - A batch commit is atomic: if any operation is invalid (for example updating
//   a missing document) nothing in that batch is applied.
// - "in" and "array-contains-any" reject more than 10 values, which is the
//   chunk size the data layer assumes. Firestore's real limit may be higher.
// - Ordering, limits, listeners and security rules are NOT modelled. Rules are
//   covered by scripts/test-firestore-rules.mjs against the real emulator.

const state = {
  docs: new Map(), // "users/u/pages/p1" -> plain object
  commitCount: 0,
  failCommitAt: null, // 1-based commit number that should throw
  failure: null,
  writeLog: [], // { op, path } for every applied write
  clock: 1_700_000_000_000,
  autoId: 0,
};

export const fake = {
  reset() {
    state.docs.clear();
    state.commitCount = 0;
    state.failCommitAt = null;
    state.failure = null;
    state.writeLog = [];
    state.clock = 1_700_000_000_000;
    state.autoId = 0;
  },
  seed(path, data) { state.docs.set(path, structuredCloneSafe(data)); },
  read(path) { return state.docs.has(path) ? structuredCloneSafe(state.docs.get(path)) : undefined; },
  has(path) { return state.docs.has(path); },
  paths() { return [...state.docs.keys()]; },
  list(collectionPath) {
    return [...state.docs.keys()].filter((p) => isDirectChild(collectionPath, p));
  },
  failCommit(number, error = new Error("Injected batch commit failure")) {
    state.failCommitAt = state.commitCount + number;
    state.failure = error;
  },
  clearFailure() { state.failCommitAt = null; state.failure = null; },
  get commitCount() { return state.commitCount; },
  get writeLog() { return state.writeLog.map((entry) => ({ ...entry })); },
  clearWriteLog() { state.writeLog = []; },
  setClock(ms) { state.clock = ms; },
};

function structuredCloneSafe(value) {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value, (_key, v) => (v && v.__fakeTimestamp ? { __fakeTimestamp: true, ms: v.ms } : v)), (_key, v) =>
    v && v.__fakeTimestamp ? makeTimestamp(v.ms) : v);
}
function makeTimestamp(ms) {
  return { __fakeTimestamp: true, ms, toDate: () => new Date(ms), toMillis: () => ms };
}
function isDirectChild(collectionPath, docPath) {
  if (!docPath.startsWith(`${collectionPath}/`)) return false;
  return !docPath.slice(collectionPath.length + 1).includes("/");
}
function pathOf(segments) { return segments.filter((s) => s !== undefined).join("/"); }
// A server timestamp resolves to ONE value per commit (as in Firestore), so every
// document written by the same batch receives the same timestamp.
function nextStamp() { state.clock += 1; return makeTimestamp(state.clock); }
function resolveValue(value, stamp) {
  if (value && value.__serverTimestamp) return stamp;
  if (Array.isArray(value)) return value.map((item) => resolveValue(item, stamp));
  return value;
}
function applyPatch(existing, patch, stamp = nextStamp()) {
  const next = { ...existing };
  for (const [key, value] of Object.entries(patch)) next[key] = resolveValue(value, stamp);
  return next;
}
function snapshotOf(path) {
  const id = path.split("/").at(-1);
  const ref = { type: "document", path, id };
  return { id, ref, exists: () => state.docs.has(path), data: () => structuredCloneSafe(state.docs.get(path)) };
}

export const serverTimestamp = () => ({ __serverTimestamp: true });
export const collection = (_db, ...segments) => ({ type: "collection", path: pathOf(segments) });
export const doc = (first, ...segments) => {
  const path = first && first.type === "collection" ? pathOf([first.path, ...segments]) : pathOf(segments);
  return { type: "document", path, id: path.split("/").at(-1) };
};
export const where = (field, op, value) => ({ type: "where", field, op, value });
export const orderBy = (field, dir) => ({ type: "orderBy", field, dir });
export const limit = (n) => ({ type: "limit", n });
export const documentId = () => "__name__";
export const query = (source, ...constraints) => ({ type: "query", source, constraints });

function matches(data, { field, op, value }) {
  const actual = data[field];
  if (op === "==") return actual === value;
  if (op === "in") {
    if (!Array.isArray(value) || value.length > 10) throw new Error("fake Firestore: 'in' accepts at most 10 values");
    return value.includes(actual);
  }
  if (op === "array-contains-any") {
    if (!Array.isArray(value) || value.length > 10) throw new Error("fake Firestore: 'array-contains-any' accepts at most 10 values");
    return Array.isArray(actual) && actual.some((item) => value.includes(item));
  }
  if (op === "array-contains") return Array.isArray(actual) && actual.includes(value);
  throw new Error(`fake Firestore: unsupported operator ${op}`);
}

export async function getDocs(source) {
  const colPath = source.type === "query" ? source.source.path : source.path;
  const wheres = source.type === "query" ? source.constraints.filter((c) => c.type === "where") : [];
  const docs = fake.list(colPath)
    .filter((path) => wheres.every((w) => w.field === "__name__" ? true : matches(state.docs.get(path), w)))
    .map(snapshotOf);
  return { docs, size: docs.length, empty: docs.length === 0 };
}
export async function getDoc(ref) { return snapshotOf(ref.path); }
export async function addDoc(colRef, data) {
  state.autoId += 1;
  const path = `${colRef.path}/auto-${state.autoId}`;
  state.docs.set(path, applyPatch({}, data));
  state.writeLog.push({ op: "add", path });
  return { type: "document", path, id: `auto-${state.autoId}` };
}
export async function setDoc(ref, data) {
  state.docs.set(ref.path, applyPatch({}, data));
  state.writeLog.push({ op: "set", path: ref.path });
}
export async function updateDoc(ref, patch) {
  if (!state.docs.has(ref.path)) throw new Error(`fake Firestore: NOT_FOUND ${ref.path}`);
  state.docs.set(ref.path, applyPatch(state.docs.get(ref.path), patch));
  state.writeLog.push({ op: "update", path: ref.path });
}
export const onSnapshot = () => () => {};

export function writeBatch() {
  const ops = [];
  return {
    update(ref, patch) { ops.push({ op: "update", path: ref.path, patch }); },
    delete(ref) { ops.push({ op: "delete", path: ref.path }); },
    set(ref, data) { ops.push({ op: "set", path: ref.path, data }); },
    async commit() {
      state.commitCount += 1;
      if (state.failCommitAt === state.commitCount) throw state.failure;
      if (ops.length > 500) throw new Error("fake Firestore: a batch accepts at most 500 writes");
      for (const item of ops) {
        if (item.op === "update" && !state.docs.has(item.path)) throw new Error(`fake Firestore: NOT_FOUND ${item.path}`);
      }
      const stamp = nextStamp();
      for (const item of ops) {
        if (item.op === "update") state.docs.set(item.path, applyPatch(state.docs.get(item.path), item.patch, stamp));
        if (item.op === "set") state.docs.set(item.path, applyPatch({}, item.data, stamp));
        if (item.op === "delete") state.docs.delete(item.path);
        state.writeLog.push({ op: item.op, path: item.path });
      }
    },
  };
}
