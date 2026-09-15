import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// Every piece of data lives under users/{uid}/... so the Firestore
// security rules (see firestore.rules) can lock each user to their own tree.

const userPath = (uid, ...segments) => ["users", uid, ...segments];

// ---------- Generic collection subscription ----------
export function subscribeCollection(uid, collectionName, cb, orderField) {
  const ref = collection(db, ...userPath(uid, collectionName));
  const q = orderField ? query(ref, orderBy(orderField)) : ref;
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(items);
  });
}

// ---------- Subjects (Academics) ----------
export const addSubject = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "subjects")), {
    ...data,
    createdAt: serverTimestamp(),
  });

export const updateSubject = (uid, subjectId, data) =>
  updateDoc(doc(db, ...userPath(uid, "subjects", subjectId)), data);

export const deleteSubject = (uid, subjectId) =>
  deleteDoc(doc(db, ...userPath(uid, "subjects", subjectId)));

// ---------- Tasks ----------
export const addTask = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "tasks")), {
    ...data,
    completed: false,
    createdAt: serverTimestamp(),
  });

export const toggleTask = (uid, taskId, completed) =>
  updateDoc(doc(db, ...userPath(uid, "tasks", taskId)), {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
  });

export const deleteTask = (uid, taskId) =>
  deleteDoc(doc(db, ...userPath(uid, "tasks", taskId)));

// ---------- Habits ----------
// Habit definitions: users/{uid}/meta/habitList -> { habits: [{id,name}] }
export async function getHabitList(uid) {
  const ref = doc(db, ...userPath(uid, "meta", "habitList"));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().habits || [] : [];
}

export function subscribeHabitList(uid, cb) {
  const ref = doc(db, ...userPath(uid, "meta", "habitList"));
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? snap.data().habits || [] : []);
  });
}

export const setHabitList = (uid, habits) =>
  setDoc(doc(db, ...userPath(uid, "meta", "habitList")), { habits });

// Daily habit log: users/{uid}/habitLogs/{YYYY-MM-DD} -> { [habitId]: true }
export const setHabitLog = (uid, dateKey, habitId, value) =>
  setDoc(
    doc(db, ...userPath(uid, "habitLogs", dateKey)),
    { [habitId]: value },
    { merge: true }
  );

export function subscribeHabitLogs(uid, cb) {
  const ref = collection(db, ...userPath(uid, "habitLogs"));
  return onSnapshot(ref, (snap) => {
    const logs = {};
    snap.docs.forEach((d) => (logs[d.id] = d.data()));
    cb(logs);
  });
}

// ---------- Deadlines ----------
export const addDeadline = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "deadlines")), data);

export const deleteDeadline = (uid, deadlineId) =>
  deleteDoc(doc(db, ...userPath(uid, "deadlines", deadlineId)));

// ---------- Study / Work (generic — replaces the fixed Academics module) ----------
// users/{uid}/studyPrograms/{id}   -> { name }
// users/{uid}/studySubjects/{id}   -> { programId, name }
// users/{uid}/studyContents/{id}   -> { subjectId, type, title, notes, url,
//                                       instructor, hasDuration,
//                                       totalSeconds, completedSeconds, done }
export const addStudyProgram = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "studyPrograms")), {
    ...data,
    createdAt: serverTimestamp(),
  });
export const updateStudyProgram = (uid, id, data) =>
  updateDoc(doc(db, ...userPath(uid, "studyPrograms", id)), data);
export const deleteStudyProgram = (uid, id) =>
  deleteDoc(doc(db, ...userPath(uid, "studyPrograms", id)));

export const addStudySubject = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "studySubjects")), {
    ...data,
    createdAt: serverTimestamp(),
  });
export const updateStudySubject = (uid, id, data) =>
  updateDoc(doc(db, ...userPath(uid, "studySubjects", id)), data);
export const deleteStudySubject = (uid, id) =>
  deleteDoc(doc(db, ...userPath(uid, "studySubjects", id)));

export const addStudyContent = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "studyContents")), {
    ...data,
    createdAt: serverTimestamp(),
  });
export const updateStudyContent = (uid, id, data) =>
  updateDoc(doc(db, ...userPath(uid, "studyContents", id)), data);
export const deleteStudyContent = (uid, id) =>
  deleteDoc(doc(db, ...userPath(uid, "studyContents", id)));

// ============================================================================
// DISABLED — do not call this function, and do not re-add a call to it
// anywhere in the app's startup/login flow.
//
// Removed from App.jsx's Gate on [architecture foundation pass] because it
// ran automatically and unconditionally on every login with no user
// consent, and because it wrote hardcoded institutional labels ("B.Tech",
// "(Backlog)", "(Sem 5)") into new Firestore documents — both directly
// against the approved FocusOS architecture (see CLAUDE.md).
//
// It is also schema-incompatible with the target Study/Work model: it
// writes into the old fixed studyPrograms/studySubjects/studyContents
// collections, which are being replaced by the generic users/{uid}/nodes
// hierarchy (see CLAUDE.md "Generic node system").
//
// Kept here, unused, only as a reference for whoever eventually builds the
// real import feature. That feature must be: explicit (a button the user
// clicks), opt-in (never runs on its own), non-destructive (never touches
// `subjects`), and must not hardcode any institutional name — the user
// names the imported root themselves at import time.
//
// The original `subjects` collection is never modified or deleted by this
// function — it only ever reads from `subjects`.
// ============================================================================
export async function migrateAcademicsToStudy_DISABLED_DO_NOT_CALL(uid) {
  const flagRef = doc(db, ...userPath(uid, "meta", "studyMigrated"));
  const flagSnap = await getDoc(flagRef);
  if (flagSnap.exists()) return;

  const subjectsSnap = await getDocs(collection(db, ...userPath(uid, "subjects")));
  if (subjectsSnap.empty) {
    await setDoc(flagRef, { migratedAt: new Date().toISOString(), skipped: true });
    return;
  }

  const programRef = await addDoc(collection(db, ...userPath(uid, "studyPrograms")), {
    name: "B.Tech",
    createdAt: serverTimestamp(),
  });

  for (const subjectDoc of subjectsSnap.docs) {
    const s = subjectDoc.data();
    const tag = s.type === "backlog" ? "(Backlog)" : s.type === "sem5" ? "(Sem 5)" : "";
    const subjectRef = await addDoc(collection(db, ...userPath(uid, "studySubjects")), {
      programId: programRef.id,
      name: [s.name, tag].filter(Boolean).join(" "),
      createdAt: serverTimestamp(),
    });
    for (const unit of s.units || []) {
      await addDoc(collection(db, ...userPath(uid, "studyContents")), {
        subjectId: subjectRef.id,
        type: "notes",
        title: unit.name,
        notes: unit.notes || "",
        hasDuration: false,
        done: !!unit.done,
        createdAt: serverTimestamp(),
      });
    }
  }

  await setDoc(flagRef, { migratedAt: new Date().toISOString(), skipped: false });
}

// ---------- Pomodoro ----------
// users/{uid}/pomodoroSessions/{id} -> { date, durationMinutes, label,
//                                         studyContentId, completedAt }
export const addPomodoroSession = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "pomodoroSessions")), {
    ...data,
    createdAt: serverTimestamp(),
  });

export function subscribePomodoroSessions(uid, cb) {
  return subscribeCollection(uid, "pomodoroSessions", cb);
}

// ---------- Exercise ----------
// users/{uid}/exerciseLogs/{id} -> { date, name, durationMinutes, sets,
//                                     reps, createdAt }
export const addExerciseLog = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "exerciseLogs")), {
    ...data,
    createdAt: serverTimestamp(),
  });
export const updateExerciseLog = (uid, id, data) =>
  updateDoc(doc(db, ...userPath(uid, "exerciseLogs", id)), data);
export const deleteExerciseLog = (uid, id) =>
  deleteDoc(doc(db, ...userPath(uid, "exerciseLogs", id)));

// Weight history: users/{uid}/weightLogs/{YYYY-MM-DD} -> { weightKg }
// Height is a single slow-changing value, stored on profile instead
// (see setProfile heightCm field) — weight changes often enough during
// a gain/loss goal to warrant real per-day history.
export const setWeightLog = (uid, dateKey, weightKg) =>
  setDoc(doc(db, ...userPath(uid, "weightLogs", dateKey)), { weightKg }, { merge: true });

export function subscribeWeightLogs(uid, cb) {
  const ref = collection(db, ...userPath(uid, "weightLogs"));
  return onSnapshot(ref, (snap) => {
    const out = {};
    snap.docs.forEach((d) => (out[d.id] = d.data().weightKg));
    cb(out);
  });
}

// ---------- Namaz (5 daily prayers) ----------
// users/{uid}/prayerLogs/{YYYY-MM-DD} -> { fajr, dhuhr, asr, maghrib, isha: bool }
export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const setPrayerLog = (uid, dateKey, prayer, value) =>
  setDoc(
    doc(db, ...userPath(uid, "prayerLogs", dateKey)),
    { [prayer]: value },
    { merge: true }
  );

export function subscribePrayerLogs(uid, cb) {
  const ref = collection(db, ...userPath(uid, "prayerLogs"));
  return onSnapshot(ref, (snap) => {
    const out = {};
    snap.docs.forEach((d) => (out[d.id] = d.data()));
    cb(out);
  });
}

// ---------- Timetables ----------
// users/{uid}/timetables/{id} -> { name, description, active, entries:[{id,from,to,task}] }
export const addTimetable = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "timetables")), {
    ...data,
    active: false,
    createdAt: serverTimestamp(),
  });

export const updateTimetable = (uid, id, data) =>
  updateDoc(doc(db, ...userPath(uid, "timetables", id)), data);

export const deleteTimetable = (uid, id) =>
  deleteDoc(doc(db, ...userPath(uid, "timetables", id)));

// Atomically activates one timetable and deactivates all others, so the
// "only one active at a time" rule can never be violated by a partial write.
export async function setActiveTimetable(uid, timetableId) {
  const ref = collection(db, ...userPath(uid, "timetables"));
  const snap = await getDocs(ref);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { active: d.id === timetableId });
  });
  await batch.commit();
}

// Completion is date-based history, never stored on the timetable itself —
// a reused timetable gets a fresh checkbox every day while history persists.
// users/{uid}/timetableCompletions/{YYYY-MM-DD} -> { "<timetableId>:<entryId>": true }
export const setTimetableCompletion = (uid, dateKey, entryKey, value) =>
  setDoc(
    doc(db, ...userPath(uid, "timetableCompletions", dateKey)),
    { [entryKey]: value },
    { merge: true }
  );

export function subscribeTimetableCompletions(uid, cb) {
  const ref = collection(db, ...userPath(uid, "timetableCompletions"));
  return onSnapshot(ref, (snap) => {
    const out = {};
    snap.docs.forEach((d) => (out[d.id] = d.data()));
    cb(out);
  });
}

// ---------- Reminders ----------
// users/{uid}/reminders/{id} -> { title, description, date, time, type, repeat }
export const addReminder = (uid, data) =>
  addDoc(collection(db, ...userPath(uid, "reminders")), {
    ...data,
    createdAt: serverTimestamp(),
  });

export const updateReminder = (uid, reminderId, data) =>
  updateDoc(doc(db, ...userPath(uid, "reminders", reminderId)), data);

export const deleteReminder = (uid, reminderId) =>
  deleteDoc(doc(db, ...userPath(uid, "reminders", reminderId)));

// ---------- Profile ----------
// users/{uid}/profile/main -> { name, hijriAdjustmentDays, sidebarCollapsed? }
export async function getProfile(uid) {
  const ref = doc(db, ...userPath(uid, "profile", "main"));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function subscribeProfile(uid, cb) {
  const ref = doc(db, ...userPath(uid, "profile", "main"));
  return onSnapshot(ref, (snap) => cb(snap.exists() ? snap.data() : null));
}

export const setProfile = (uid, data) =>
  setDoc(doc(db, ...userPath(uid, "profile", "main")), data, { merge: true });

// ---------- One-time seed data for a brand new account ----------
export async function seedInitialData(uid) {
  const flagRef = doc(db, ...userPath(uid, "meta", "seeded"));
  const flagSnap = await getDoc(flagRef);
  if (flagSnap.exists()) return; // already seeded, never overwrite again

  await setHabitList(uid, [
    { id: "fajr", name: "Fajr Prayer" },
    { id: "prayers", name: "5 Daily Prayers" },
    { id: "study4h", name: "Study (Min. 4 hrs)" },
    { id: "workout", name: "Workout" },
    { id: "read20", name: "Read 20 Pages" },
    { id: "nosocial", name: "No Social Media (Study Hours)" },
  ]);

  const backlogExamWindow = "2026-10-25"; // approx, edit once university confirms
  await Promise.all([
    addDeadline(uid, {
      title: "Backlog Registration Deadline",
      date: "2026-08-28",
      type: "critical",
    }),
    addDeadline(uid, {
      title: "Semester 4 Backlog Exams (approx.)",
      date: backlogExamWindow,
      type: "exam",
    }),
    addDeadline(uid, {
      title: "Semester 5 Exams (approx.)",
      date: backlogExamWindow,
      type: "exam",
    }),
  ]);

  await Promise.all(
    [
      { name: "Subject 1", type: "backlog" },
      { name: "Subject 2", type: "backlog" },
      { name: "Subject 3", type: "backlog" },
      { name: "Subject 4", type: "backlog" },
    ].map((s) =>
      addSubject(uid, {
        ...s,
        units: [1, 2, 3, 4, 5].map((n) => ({
          id: `u${n}`,
          name: `Unit ${n}`,
          topics: [],
          notes: "",
          done: false,
        })),
      })
    )
  );

  await setDoc(flagRef, { seededAt: new Date().toISOString() });
}
