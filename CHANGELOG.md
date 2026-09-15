# CHANGELOG.md

Reverse chronological. Every session adds one entry when it finishes a
unit of work. Keep entries factual: what changed, what files, why (if not
obvious).

---

## 2026-09-03 — Phase 1: Generic Node Data Layer (`src/data/nodes.js`)

Temporary takeover: Account 1 (the assigned implementer) hit its usage
limit before starting this work. This session inspected the actual
repository state first (confirmed via `git fetch`/`git log` — found
`src/data/` did not exist yet, so this was greenfield, not a partial-work
continuation), then implemented Phase 1 from scratch against the
already-locked architecture and the already-tested
`domain/nodeTree.js`/`domain/progress.js` contracts.

**Added:**
- `src/data/nodes.js` — Firestore CRUD for `nodes`/`nodes/{id}/values/{date}`.
  Full function list: `addNode`, `getNode`, `updateNode`, `archiveNode`,
  `deleteNode`, `getNodes`, `subscribeNodes`, `rootNodes`, `reparentNode`,
  `setNodeValue`, `getNodeValue`, `subscribeNodeValue`,
  `getNodeValueRange`. Validates `moduleKey` and `tracking.type` on every
  write; `reparentNode` uses `domain/nodeTree.js`'s `wouldCreateCycle` and
  `computeDescendantPathUpdates` rather than reimplementing hierarchy
  logic; a node's `moduleKey` is validated to match its parent's on both
  create and re-parent; archiving never touches historical
  `values/{date}` documents.
- `src/data/nodeValidation.js` — the `moduleKey`/`tracking` validation
  logic, deliberately split out of `nodes.js` into its own Firebase-free
  file so it can be unit-tested with plain `node` (`nodes.js` itself
  transitively imports `lib/firebase.js`, which reads Vite's
  `import.meta.env` and throws immediately outside a Vite build — this
  is why `lib/data.js` has never had direct unit tests either, and why
  this split was necessary rather than optional).
- `scripts/test-nodeValidation.mjs` — 19 assertions covering moduleKey
  validation (including the specific case of a nav-only key like
  `"pomodoro"` correctly being rejected as an invalid node `moduleKey`),
  all 7 tracking types, tracking normalization/defaults (including the
  `target: 0` edge case — falsy but valid, must not be nulled), and node
  name validation. All passing.

**Changed:**
- `src/modules/registry.js` — added an `isNodeModule` flag to `MODULES`
  entries (`study` is the only one currently `true`) and derived
  `NODE_MODULE_KEYS`/`isValidNodeModuleKey()` from it, rather than
  creating a second, separate module-key list. This was a deliberate,
  minimal resolution to a real conflict: the task instructions said to
  use `registry.js` as "the source of truth for valid module keys," but
  `registry.js`'s existing `MODULES` list is the broader nav-capability
  set (includes `pomodoro`, `tasks`, `settings`, etc.) — using it
  unmodified would have let a node be created with an invalid
  `moduleKey` like `"pomodoro"`, exactly the conflation the architecture
  was designed to prevent (see this file's 2026-09-03 "Architecture
  foundation" entry and `CLAUDE.md`). Tagging the existing list rather
  than adding a parallel one keeps a single source of truth while fixing
  the scoping.

**Explicitly NOT touched:** `App.jsx`, `Sidebar.jsx`, `Dashboard.jsx`,
`Study.jsx`, `Pomodoro.jsx`, `Exercise.jsx`, `Tasks.jsx`, `config/main`
(doesn't exist yet), `firestore.rules` (unnecessary — the existing
wildcard rule already covers `nodes` and its subcollection), any
migration/import logic, any UI wiring of the module registry. No node UI
was built — this is data-layer only, per explicit instruction to stop
before Phase 2.

**Known test gap, recorded honestly rather than glossed over:**
`nodes.js`'s actual Firestore calls (the CRUD itself) were NOT run
against a live or emulated Firestore — no test framework or emulator is
set up in this environment. Verified instead by: syntax check
(`node --check`), a temporary/reverted forced import into `main.jsx` to
confirm Vite's real build pipeline resolves the entire import chain with
zero errors (module count went 1857 → 1862 and back cleanly), and code
review against the already-tested `nodeTree.js`/`progress.js` it
delegates to. The genuinely pure, extractable logic (validation) IS unit
tested. Recommended next step, before building UI on this: a real
Firestore emulator or scratch-project integration check.

**Verification performed:** `npm run build` — 0 errors.
`npx oxlint src/ scripts/` — 0 errors, 4 warnings, identical set to the
prior session's baseline (2 pre-existing in `Study.jsx`, 1 in
`Login.jsx`, 1 in `auth.jsx` — none introduced by this session's
changes). `node scripts/test-nodeTree.mjs` — all passing, unchanged file.
`node scripts/test-progress.mjs` — all passing, unchanged file.
`node scripts/test-nodeValidation.mjs` — all passing, new file, 19
assertions.

**Files touched:** 3 new (`src/data/nodes.js`, `src/data/nodeValidation.js`,
`scripts/test-nodeValidation.mjs`), 1 modified
(`src/modules/registry.js`), plus `PROJECT_STATUS.md` and this file.

**Git status:** this session does not have push access to GitHub (same
limitation as the 2026-09-02 documentation-sync session) — the
`git commit`/`git push` requested in the task instructions could not be
performed. All changes are staged and verified locally; see the handed-off
files/patch for the user to apply and push themselves.

---

## 2026-09-03 — Architecture foundation: generic nodes, disabled auto-migration, corrected CLAUDE.md

FocusOS's product direction was formally revised: from a fixed
student-productivity app to a customizable personal operating system
(hybrid architecture — generic `nodes` hierarchy for genuinely
tree-shaped domains, feature-specific collections for everything else,
a thin configuration layer, a closed module registry). This followed a
multi-round design process and an audit of commit `99fb1ca`, which had
built Study/Work as a fixed `studyPrograms → studySubjects →
studyContents` schema with an automatic, unconditional migration from
`subjects` — both against the newly-approved architecture, though not
through any fault of whoever built `99fb1ca`: `CLAUDE.md` still
documented the old fixed-schema assumption at the time, so `99fb1ca`
was internally consistent with the documentation it had. This session
corrects that documentation gap and lays the tested foundation for the
rebuild — it does not itself rebuild Study/Work, Pomodoro, or the
Dashboard.

**Changed:**
- `src/App.jsx` — removed the unconditional `migrateAcademicsToStudy()`
  call from `Gate`'s login-time `useEffect`. Import statement updated
  accordingly.
- `src/lib/data.js` — the migration function itself renamed to
  `migrateAcademicsToStudy_DISABLED_DO_NOT_CALL` and given an extensive
  comment explaining why it was disabled and what a correct future
  replacement must look like (explicit, opt-in, non-destructive,
  no hardcoded labels). Function body otherwise unchanged — kept only
  as a reference, not deleted, per "keep rollback paths" principle.
- `CLAUDE.md` — corrected throughout: product framing ("What this
  project is"), the stale "Study Program → Subject → Content" rule
  replaced with the actual locked generic-node architecture, new
  sections added ("Generic node system", "Module registry &
  configuration", "Frontend layering"), architecture map and Firestore
  data model sections updated to match the real current repository
  (including the now-superseded `studyPrograms`/etc. collections and
  the planned `nodes`/`config` collections), testing discipline section
  updated to reference the new `scripts/` test files.

**Added:**
- `src/domain/progress.js` — pure, zero-Firebase/React generic progress
  calculation contract (`calculateLeafProgress`,
  `aggregateChildrenProgress`, `computeNodeProgress`), matching the
  approved 7 tracking types with "average" as the only aggregation mode
  (weighted/sum/any-all deliberately not implemented — no approved
  requirement for them yet).
- `src/domain/nodeTree.js` — pure hierarchy/path contract
  (`computeNodePath`, `computeDescendantPathUpdates`, `childrenOf`,
  `hasAncestor`, `wouldCreateCycle`). `path` is ancestors-only, excludes
  self, always derived from `parentId` — never a separate source of
  truth.
- `src/modules/registry.js` — the closed, FocusOS-controlled list of
  toggleable capabilities (`MODULES`) plus `isModuleEnabled()`, with a
  safe-default rule (missing config = visible). Explicitly documented as
  a *different* closed set from a node's `moduleKey` field, to prevent
  the two concepts being conflated in future work.
- `scripts/test-progress.mjs`, `scripts/test-nodeTree.mjs` — plain
  `node`-runnable verification, following the project's existing
  testing convention (no framework installed). 41 assertions total,
  all passing. Run with `node scripts/test-progress.mjs` /
  `node scripts/test-nodeTree.mjs`.

**Explicitly NOT changed this session** (see `PROJECT_STATUS.md`'s "Next
Task" for what happens to these next): `Study.jsx`, `Pomodoro.jsx`,
`Exercise.jsx`, `Dashboard.jsx`, `Sidebar.jsx`, `Tasks.jsx`,
`studyPrograms`/`studySubjects`/`studyContents` collections and their
data, `subjects` collection, `firestore.rules` (already correct — the
existing wildcard rule already covers `nodes` and `config` with no
changes needed).

**Verification performed:** `npm run build` (0 errors — note: a
pre-existing, unrelated `Logo.jsx`/`logo.jsx` casing issue, tracked in
`PROJECT_STATUS.md`'s Known Issues, was worked around locally with an
untracked file for verification purposes only, not part of this
commit), `npx oxlint src/` (0 errors, 4 warnings — 2 pre-existing/known,
2 pre-existing in `Study.jsx` unrelated to this session's changes,
confirmed by checking the same file at the prior commit), both new test
scripts passing (41/41 assertions).

**Files touched:** 2 modified (`src/App.jsx`, `src/lib/data.js`), 3 new
source files (`src/domain/progress.js`, `src/domain/nodeTree.js`,
`src/modules/registry.js`), 2 new test scripts, plus `CLAUDE.md`,
`PROJECT_STATUS.md`, this file.

---

## Retroactive entry — Study/Pomodoro/Exercise (commit `99fb1ca`)

**Note:** No changelog entry existed for this commit prior to this
session. Reconstructed from reading the actual code and `git diff
aa2c7b7 99fb1ca`, not from a session log.

**Added:**
- `src/lib/study.js` — `CONTENT_TYPES` (hardcoded enum: lecture, video,
  book, chapter, notes, pyq, assignment, custom), `contentStatus()`,
  `contentPercent()` (both correctly derive status from actual progress
  rather than a separate stored field — good pattern, worth keeping
  conceptually even though the surrounding schema is being replaced),
  `formatHMS()`/`hmsToSeconds()`/`secondsToHms()` time helpers.
- `src/pages/Study.jsx` — Program → Subject → Content UI: breadcrumb
  nav, add/edit modals, a duration-based progress editor for
  duration-tracked content.
- `src/pages/Pomodoro.jsx` — 25/5 and 50/10 presets, custom preset,
  start/pause/reset timer, optional linking to a Study program/subject,
  sessions logged on focus-phase completion.
- `src/pages/Exercise.jsx` — height (stored on profile), daily weight
  log, daily exercise log with sets/reps/duration, today/history views.
- `src/lib/data.js` — `addStudyProgram`/`Subject`/`Content` + update/
  delete variants; `migrateAcademicsToStudy()` (see the 2026-09-03 entry
  above for why this was disabled); `addPomodoroSession`,
  `subscribePomodoroSessions`; `addExerciseLog`/`update`/`delete`,
  `setWeightLog`/`subscribeWeightLogs`.

**Changed:**
- `src/App.jsx` — added `/study`, `/pomodoro`, `/exercise` routes;
  removed `/tasks` route; added the (since-removed) automatic migration
  call.
- `src/components/Sidebar.jsx` — added Study/Pomodoro/Exercise nav
  links, removed Tasks nav link.
- `src/pages/Dashboard.jsx` — replaced the Tasks stat card with
  Pomodoro-today and Exercise-today cards.

**Firestore:** new collections `studyPrograms`, `studySubjects`,
`studyContents`, `pomodoroSessions`, `exerciseLogs`, `weightLogs`, plus
`meta/studyMigrated` (migration guard flag). `tasks` collection and its
CRUD functions in `data.js` were **not** touched — confirmed intact by
diff, only the route/nav were removed.

**Superseded 2026-09-03:** the Study data model (`studyPrograms`/etc.)
and the automatic migration are being replaced — see the entry above and
`PROJECT_STATUS.md`'s "Next Task". Pomodoro, Exercise, and the Dashboard
card swap are being kept as-is architecturally sound.

---

## 2026-09-02 — Process: documentation sync (PROJECT_STATUS.md, CHANGELOG.md)

A repository inspection found that `PROJECT_STATUS.md` and this
changelog had drifted significantly out of date: Batch 4 (Timetable) was
still listed as "Next Task" and Batch 5 wasn't mentioned at all, while
the actual code in `src/` shows both are implemented. This session
updated `PROJECT_STATUS.md` and added the four retroactive entries below
(Batch 4, 5A, 5B, 5C) based on reading the current code. No application
code, Firebase config, or Firestore rules were changed.

**Files touched:** 2 (`PROJECT_STATUS.md`, `CHANGELOG.md`), both edited,
no code changes.

---

## Retroactive entry — Batch 4: Timetable system

**Note:** No changelog entry existed for this batch prior to this sync.
Original implementation date is unknown. Details below are reconstructed
from reading the current code on 2026-09-02, not from a session log.

**Added (per current code):**
- `src/lib/timetable.js` — `timeToMinutes()`, `formatTime12()`,
  `formatDuration()`, `entryDuration()` (derives duration from from/to,
  never stored), `validateEntries()` (detects overlaps, computes
  scheduled/unscheduled/conflict minutes out of a 24h day)
- `src/components/TimePicker.jsx` — hour/minute/AM-PM picker used in the
  timetable editor
- `src/pages/Timetables.jsx` — timetable list, create/edit modal with
  row-based entry editor, active-timetable toggle, today's checklist for
  the active timetable

**Changed (per current code):**
- `src/lib/data.js` — `addTimetable`, `updateTimetable`, `deleteTimetable`,
  `setActiveTimetable` (batch-writes so only one timetable is ever
  active), `setTimetableCompletion`, `subscribeTimetableCompletions`
- `src/App.jsx` — `/timetables` route wired to the real page
- `src/pages/Dashboard.jsx` — added a "Timetable Follow" stat card reading
  from the active timetable + today's completions

**Firestore:** new collections `users/{uid}/timetables/{id}` and
`users/{uid}/timetableCompletions/{date}`, confirmed live in
`src/lib/data.js`.

---

## Retroactive entry — Batch 5A: FocusOS rebrand + Home/Dashboard redesign

**Note:** No changelog entry existed for this batch prior to this sync.
Original implementation date is unknown. Details below are reconstructed
from reading the current code on 2026-09-02.

**Changed (per current code):**
- `src/components/Sidebar.jsx` — header text changed to "FocusOS"
- `src/pages/Dashboard.jsx` — rebuilt around a `StatCard` grid (Habits,
  Timetable Follow, Tasks, Namaz), replacing whatever the prior dashboard
  layout was
- `src/components/StartCard.jsx` — new component (exports `StatCard`);
  filename does not match the exported name

**Added (per current code):**
- Namaz (5 daily prayers) tracking: `PRAYERS` constant and
  `setPrayerLog()` / `subscribePrayerLogs()` in `src/lib/data.js`, new
  `users/{uid}/prayerLogs/{date}` collection, inline prayer-toggle UI on
  the Dashboard

This collection and feature were not previously documented in
CLAUDE.md's Firestore data model section — flagged for that file to be
updated separately (out of scope for this documentation-sync session,
which touches only PROJECT_STATUS.md and CHANGELOG.md).

---

## Retroactive entry — Batch 5B: Calendar compaction

**Note:** No changelog entry existed for this batch prior to this sync,
and no prior version of `Calendar.jsx` was available for comparison.
This entry records the current state only — it cannot describe what
specifically changed or when.

**Observed in current code (`src/pages/Calendar.jsx`):**
- Compact month-grid cell sizing and small type scale for day numbers
- Two-column layout combining the month grid with a side panel (selected
  day detail + "Upcoming" reminders list)

---

## Retroactive entry — Batch 5C: Timetable UX

**Note:** No changelog entry existed for this batch prior to this sync.
This entry records the current state only, reconstructed from code.

**Observed in current code:**
- `src/components/TimePicker.jsx` — dedicated hour/minute/AM-PM picker
  used in place of raw `<input type="time">` fields in the timetable
  editor
- `src/pages/Timetables.jsx` — segmented progress bar showing scheduled /
  conflict minutes, plus inline "Schedule Conflict" and "End time must be
  after start time" warnings, driven by `validateEntries()` from
  `src/lib/timetable.js`

---

## 2026-08-29 — Process: multi-session collaboration setup

Created `CLAUDE.md`, `PROJECT_STATUS.md`, `CHANGELOG.md` to allow
development to continue across multiple Claude sessions/accounts
sequentially without losing context. See CLAUDE.md for the protocol.

No code changes.

---

## 2026-08-29 — Logo / branding

**Added:**
- `src/components/Logo.jsx` — geometric "A" monogram SVG (brass strokes,
  teal accent dot), matches the existing progress-ring visual language

**Changed:**
- `public/favicon.svg` — replaced default Vite placeholder with the new mark
- `src/components/Sidebar.jsx` — logo added to header; header layout fixed
  to stack vertically when collapsed (was previously going to overflow the
  64px collapsed width)
- `src/pages/ProfileSetup.jsx` — logo added above welcome heading
- `src/pages/Login.jsx` — logo added; also removed leftover old
  "Command Center" title and "Discipline today, freedom tomorrow" tagline
  that should have been updated in the Batch 1 rename but was missed

**Files touched:** 5 (1 new, 4 edited)

**Note added 2026-09-02:** the committed file is actually
`src/components/logo.jsx` (lowercase), not `Logo.jsx` as recorded here —
see Known Issues in PROJECT_STATUS.md.

---

## 2026-08-29 — Repo/folder cleanup (process, no feature work)

Local project had accumulated multiple disconnected duplicate folders
(zip extractions landing as `anas-command-center (2)`, `-batch1`,
`-batch2` etc. in Downloads) after several rounds of zip handoffs. Root
causes identified:
1. Windows auto-renaming folders on duplicate zip extraction
2. An earlier `git push` had silently failed due to missing GitHub
   authentication — the "empty repo" scare was actually the *first*
   successful push, not data loss

Resolved by: deleting all duplicate folders, deleting and recreating the
GitHub repo for a clean baseline, moving the working folder to
`C:\Users\rexy2\anas-os` (out of Downloads), re-initializing git there,
and pushing a fresh baseline commit.

**Lesson for future sessions:** never hand off full-project zips for
incremental work — file-by-file diffs only (now codified in CLAUDE.md's
File Handoff Rule).

---

## 2026-08-29 — Batch 3: Reminders + Recurrence

**Added:**
- `src/lib/reminders.js` — `occursOnDate()`, `nextOccurrence()`,
  `REMINDER_TYPES`, `REPEAT_OPTIONS`. Recurrence computed on the fly from
  a single anchor date + repeat rule, never expanded into duplicate
  Firestore documents.

**Changed:**
- `src/lib/data.js` — added `addReminder`, `updateReminder`, `deleteReminder`
- `src/pages/Calendar.jsx` — full rebuild: reminder CRUD modal, colored
  day-markers for occurrences, click-day side panel, "Upcoming" list
- `src/pages/Dashboard.jsx` — added "Upcoming Reminders" card

**Firestore:** new collection `users/{uid}/reminders/{id}`. No rules
changes needed (existing wildcard rule already covers it).

**Verification:** recurrence logic tested with 5 scripted scenarios
(yearly birthday, monthly payment, weekly, past non-repeating x2) before
shipping — all correct. Hijri conversion (from Batch 2) also spot-checked
against a published reference date.

**Files touched:** 4 (1 new, 3 edited)

---

## 2026-08-29 — Batch 2: Calendar

**Added:**
- `src/pages/Calendar.jsx` — Gregorian month grid, Hijri date under every
  cell, month navigation, today highlighted

**Changed:**
- `src/lib/dates.js` — added `getMonthGrid()`, `isSameDay()`
- `src/App.jsx` — `/calendar` route wired to real page

**Files touched:** 3 (1 new, 2 edited)

---

## 2026-08-29 — Batch 1: Profile, Home rebuild, Collapsible Sidebar

**Added:**
- `src/pages/ProfileSetup.jsx` — first-login name capture
- `src/pages/Settings.jsx` — name + Hijri adjustment editing
- `src/pages/ComingSoon.jsx` — placeholder for unbuilt routes
- `src/components/LiveClock.jsx` — 12-hour live clock
- `src/lib/hijri.js` — Gregorian<->Hijri conversion (tabular/civil algorithm)

**Changed:**
- `src/lib/data.js` — added `getProfile`, `subscribeProfile`, `setProfile`
- `src/components/Sidebar.jsx` — full rebuild: collapsible, icon-only mode,
  mobile drawer, old tagline/branding removed, new nav links added
- `src/components/Layout.jsx` — mobile top padding for fixed menu button
- `src/pages/Dashboard.jsx` — dynamic greeting, live clock, Hijri date line
- `src/App.jsx` — profile-existence gate added; new routes for
  calendar/timetables/study/settings (placeholders at this point)

**Firestore:** new doc `users/{uid}/profile/main`. No rules changes
needed.

**Packages added:** `lucide-react`

**Files touched:** 9 (5 new, 4 edited)

---

## 2026-08-25 — Phase 1: Initial build

Full initial application built: React + Vite + Tailwind + Firebase
(Auth + Firestore + Hosting). Command Center dashboard, Academics
(Subjects/Units/Notes with Backlog/Sem5 tagging), Tasks (categorized,
history), Habits (30-day grid, streaks). Firestore security rules
established (per-uid isolation). Deployed to Firebase Hosting, connected
to GitHub.

**Design system established:** deep charcoal-ink base, brass/gold accent,
teal (on-track), clay/terracotta (urgent), Source Serif 4 for headings.

This is the foundational commit all subsequent batches build on.
