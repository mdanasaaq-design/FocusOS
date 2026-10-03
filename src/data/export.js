import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

async function getUserCollection(uid, name) {
  const snapshot = await getDocs(collection(db, "users", uid, name));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function getUserDoc(uid, name, id = "main") {
  const snapshot = await getDoc(doc(db, "users", uid, name, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function getNodeSubcollection(uid, nodeId, name) {
  const snapshot = await getDocs(collection(db, "users", uid, "nodes", nodeId, name));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportFocusOSData(uid) {
  if (!uid) throw new Error("uid is required.");

  const [
    profile,
    pages,
    activity,
    nodes,
    capabilities,
    reminders,
    timetables,
    timetableCompletions,
    deadlines,
    habits,
    habitLogs,
    pomodoroSessions,
    exerciseLogs,
    config,
  ] = await Promise.all([
    getUserDoc(uid, "profile"),
    getUserCollection(uid, "pages"),
    getUserCollection(uid, "activity"),
    getUserCollection(uid, "nodes"),
    getUserCollection(uid, "capabilities"),
    getUserCollection(uid, "reminders"),
    getUserCollection(uid, "timetables"),
    getUserCollection(uid, "timetableCompletions"),
    getUserCollection(uid, "deadlines"),
    getUserCollection(uid, "habits"),
    getUserCollection(uid, "habitLogs"),
    getUserCollection(uid, "pomodoroSessions"),
    getUserCollection(uid, "exerciseLogs"),
    getUserDoc(uid, "config"),
  ]);

  const nodesWithHistory = await Promise.all(
    nodes.map(async (node) => {
      const [values, nodeActivity] = await Promise.all([
        getNodeSubcollection(uid, node.id, "values"),
        getNodeSubcollection(uid, node.id, "activity"),
      ]);
      return { ...node, values, activity: nodeActivity };
    }),
  );

  downloadJson(`focusos-backup-${new Date().toISOString().slice(0, 10)}.json`, {
    exportedAt: new Date().toISOString(),
    version: 2,
    profile,
    pages,
    activity,
    nodes: nodesWithHistory,
    capabilities,
    reminders,
    timetables,
    timetableCompletions,
    deadlines,
    habits,
    habitLogs,
    pomodoroSessions,
    exerciseLogs,
    config,
  });
}
