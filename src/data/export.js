import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

async function getUserCollection(uid, name) {
  const snapshot = await getDocs(collection(db, "users", uid, name));
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
  const [pages, activity, nodes, config] = await Promise.all([
    getUserCollection(uid, "pages"),
    getUserCollection(uid, "activity"),
    getUserCollection(uid, "nodes"),
    getUserCollection(uid, "config"),
  ]);
  downloadJson(`focusos-backup-${new Date().toISOString().slice(0, 10)}.json`, {
    exportedAt: new Date().toISOString(),
    version: 1,
    pages,
    activity,
    nodes,
    config,
  });
}
