# CLAUDE.md — Anas OS Project Instructions

Read this file fully before doing any work. This is the permanent contract
for how this project is built. It does not change often — for what's
currently happening, see `PROJECT_STATUS.md`. For history, see `CHANGELOG.md`.

## What this project is

FocusOS — a private, single-user personal operating system. Built for one
specific person (Anas), not a multi-tenant product, but architected around
this principle:

> FocusOS provides the tools; the user builds their own FocusOS.
> FocusOS should adapt to the user — the user should not have to adapt to
> FocusOS.

FocusOS is NOT fundamentally a student productivity app, an academics
tracker, a timetable app, a habit tracker, a prayer tracker, or a Pomodoro
app. Those are all *capabilities* it currently has, not what it
architecturally is. Currently live/enabled capabilities: a generic
Study/Work hierarchy, a Calendar with Hijri dates and recurring reminders,
Timetables, Habits, Namaz (5 daily prayers), Pomodoro, Exercise, and Tasks
(data intact, currently not exposed in navigation — see "Tasks" below).
Future capabilities (Goals, Finance, Screen Time, etc.) are expected and
the architecture must not make them hard to add.

**Architecture read order for any new session working on this repo:**
read this file in full, then read `PROJECT_STATUS.md`'s architecture
sections before touching any code related to Study/Work, the generic node
system, configuration, or the module registry — those areas have gone
through several rounds of design correction and the *locked decisions*
below are not optional interpretations.

## Multi-session collaboration protocol (READ THIS FIRST)

This project is developed across multiple Claude sessions/accounts,
sequentially, never simultaneously. Every session must:

1. Read this file (`CLAUDE.md`) in full.
2. Read `PROJECT_STATUS.md` — specifically the "Next Task" section. That is
   your assignment unless the user says otherwise.
3. Read `CHANGELOG.md` to understand recent history (last 3-5 entries is
   usually enough — don't need the full history for routine work).
4. Inspect the actual current code the user provides/uploads before writing
   anything. Do not assume file contents from the docs — verify against
   the real files, since docs can drift from code if a previous session
   forgot to update them.
5. Do the assigned work. Test it (see Testing Discipline below).
6. Update `PROJECT_STATUS.md` — move completed items, update "Next Task",
   log any new bugs found.
7. Add an entry to `CHANGELOG.md`.
8. Hand the user: updated code files (only what changed, never a full
   zip — see File Handoff Rule), updated `PROJECT_STATUS.md`, updated
   `CHANGELOG.md`.
9. The user applies changes, tests, and runs the git commands themselves
   (pull/commit/push) — Claude in claude.ai chat cannot do this directly.

## File Handoff Rule (hard requirement)

**Never regenerate the whole project.** Only give the user files that
actually changed, clearly labeled: "NEW FILE", "REPLACE ENTIRE FILE", or
"EDIT — <description of what changed>". This project has been broken
before by whole-project zip handoffs causing folder duplication and lost
git history. Small, precise diffs only.

## Critical rules — do not violate

- Do NOT rebuild the project from scratch under any circumstance.
- Do NOT remove or break existing working functionality without explicit
  instruction.
- Do NOT change the Firebase project (`anas-os`).
- Do NOT weaken `firestore.rules` — every user document must stay scoped
  to `users/{uid}/...` with `request.auth.uid == uid`.
- Do NOT hardcode the user's name anywhere — always read from
  `profile.name` via `subscribeProfile`.
- Do NOT build Study/Work (or any future hierarchical capability) as a
  fixed-depth schema — NOT `studyPrograms → studySubjects → studyContents`,
  not any other fixed number of levels. This was tried (see CHANGELOG.md,
  the commit implementing Study/Pomodoro/Exercise) and does not meet the
  requirement: it cannot represent real examples like
  `College → Semester 5 → AI → Unit 1 → Neural Networks` (5 levels). Use
  the generic `nodes` hierarchy instead — see "Generic node system" below.
  This is a locked architecture decision, not a style preference.
- Do NOT hardcode a fixed list of "content types" (lecture/video/book/
  chapter/etc.) as a schema-level enum. A node's `name` is fully
  user-defined; FocusOS does not need to know what a node "is" beyond its
  `moduleKey` and `tracking.type`.
- Do NOT add any automatic, unconditional data migration to the app's
  login/startup flow. Any import between collections (e.g. `subjects` into
  the generic `nodes` system) must be explicit (a button the user clicks),
  opt-in, non-destructive to the source collection, and must not hardcode
  any institutional/personal label into the data it creates — the user
  names anything it creates. See `src/lib/data.js`'s
  `migrateAcademicsToStudy_DISABLED_DO_NOT_CALL` for what NOT to do and
  why it was disabled.
- Do NOT let a user invent an arbitrary `moduleKey` value on a generic
  node, and do NOT let a user add an arbitrary entry to the module
  registry (`src/modules/registry.js`). Both are FocusOS-controlled closed
  sets. Users control node `name`, `parentId`/hierarchy placement, and
  (via configuration, once built) module visibility/order — never the
  identifiers themselves.
- Do NOT delete a feature's Firestore data as a way of disabling that
  feature. Visibility is a configuration concern (`config/main`,
  `src/modules/registry.js`); data is a persistence concern. They must
  stay decoupled. (This is why Tasks' data and CRUD functions in
  `data.js` were kept even while its nav/route were removed — the nav
  removal was the wrong mechanism and should eventually be replaced with
  a config-driven toggle, not deleted data.)
- Do NOT expose `.env` or commit real Firebase keys to git (already
  gitignored — keep it that way).
- Do NOT use localStorage for important application data — Firestore only.
  localStorage is fine only for harmless UI prefs (e.g. sidebar collapsed
  state — already implemented this way).
- Do NOT introduce a second Hijri-calendar implementation — reuse
  `src/lib/hijri.js`.

## Generic node system (locked architecture)

For genuinely hierarchical, trackable domains (Study/Work today; possibly
Goals/Health/Skills later, each added deliberately as its own `moduleKey`
when actually built) — NOT for everything. Calendar events, reminders,
timetable entries, Pomodoro sessions, exercise logs, and similar
feature-specific data stay in their own collections, as they already are.
This is a hybrid architecture, not a universal entity/type/properties/
relations database — do not generalize it further than this.

```
users/{uid}/nodes/{nodeId}
{
  id
  moduleKey: "study"            // closed set, FocusOS-controlled only
  parentId: string | null
  path: [ancestorId, ...]       // ancestors only, excludes self, derived from parentId
  name: string                   // fully user-defined
  order: number
  archived: boolean

  tracking: {
    type: "checkbox" | "count" | "duration" | "target" | "percentage" | "manual" | "derived"
    target: number | null
    unit: string | null
    period: "daily"               // only "daily" implemented; field exists for future extension
  }
  createdAt
  updatedAt
}

users/{uid}/nodes/{nodeId}/values/{date}
{ value: boolean | number, updatedAt }
```

Pure logic contracts already implemented and tested — use these, do not
reimplement hierarchy/progress math inline in a page or in `data.js`:
- `src/domain/nodeTree.js` — `computeNodePath`, `computeDescendantPathUpdates`,
  `childrenOf`, `hasAncestor`, `wouldCreateCycle`
- `src/domain/progress.js` — `calculateLeafProgress`,
  `aggregateChildrenProgress` (average only — do not add weighted/sum/
  any/all without a concrete approved requirement), `computeNodeProgress`

Verify with: `node scripts/test-nodeTree.mjs` and `node scripts/test-progress.mjs`.

**Not yet built:** `src/data/nodes.js` (Firestore CRUD for `nodes` and
`nodes/{id}/values/{date}`), the real `/study` UI on this model. See
`PROJECT_STATUS.md` for what's next.

## Module registry & configuration (locked architecture)

`src/modules/registry.js` — the closed, FocusOS-controlled list of
toggleable capabilities (nav items). Do not add a module here casually;
this is a deliberate app-level decision, not user data. This is a
*different* closed set from a node's `moduleKey` — do not conflate them
(see comments in `registry.js`).

`users/{uid}/config/main` (not yet built) — the user's own visibility/
order preferences: `enabledModules`, `homeWidgets`, `navOrder`. Missing
config must always fall back to "everything visible, default order" —
absence of config must never hide something that used to work. Disabling
a module here must only ever affect what renders; it must never touch
that module's underlying Firestore collection.

## Frontend layering (incremental direction, not a rewrite mandate)

New code for genuinely hierarchy/progress-related pure logic goes in
`src/domain/` (zero Firebase, zero React — must be `node`-testable in
isolation, following the pattern in `nodeTree.js`/`progress.js`).
Firestore CRUD, as it's split out of the single `data.js` file over time,
goes in `src/data/` (one file per domain). This split happens
incrementally, whenever a file is next touched for another reason — do
not do a big-bang reorganization of working code just to match this
structure.

Dependency direction: `pages` -> `components`/`data`/`domain`/`modules`/
`lib/auth.jsx`. `data` -> `domain` + Firebase only (never imports from
`pages`/`components`). `domain` -> nothing but other `domain` files (no
Firebase, no React). `modules/registry.js` is metadata only.

## Tech stack

- React + Vite + Tailwind CSS
- Firebase: Auth (email/password, single user), Firestore, Hosting
- react-router-dom, lucide-react (icons), date-fns (installed, use where
  it simplifies date math over hand-rolled logic)
- No backend server — Firestore is the only persistence layer

## Architecture map

src/
domain/ — pure logic, zero Firebase/React, node-testable (see scripts/)
nodeTree.js, progress.js — generic node hierarchy + progress contracts
modules/
registry.js — closed, FocusOS-controlled list of toggleable capabilities
lib/
firebase.js — Firebase app init (reads .env via import.meta.env)
auth.jsx — AuthContext: user, login(), logout()
data.js — ALL Firestore reads/writes live here (being split into
src/data/ incrementally — see "Frontend layering" above).
Add new collections' CRUD functions here for now.
dates.js — date math: todayKey, daysUntil, formatDate,
getMonthGrid, isSameDay, currentStreak, last30Days
hijri.js — Gregorian<->Hijri conversion (tabular/civil algorithm,
±adjustmentDays offset from profile settings)
reminders.js — recurrence logic: occursOnDate(), nextOccurrence()
timetable.js — duration/conflict validation for Timetables
study.js — Study content helpers tied to the OLD fixed schema; do
not extend, being replaced (see PROJECT_STATUS.md)
components/
Sidebar.jsx — collapsible nav, localStorage-persisted collapse state
Layout.jsx — wraps authenticated pages with Sidebar
logo.jsx — brand mark (SVG monogram); NOTE: imported elsewhere as
"Logo" (capital L) — a known casing bug, see PROJECT_STATUS.md
ProgressRing.jsx — circular progress SVG; currently unused/dead code
LiveClock.jsx, TimePicker.jsx, StartCard.jsx (exports StatCard —
filename mismatch, known issue)
pages/
Login.jsx, ProfileSetup.jsx, Settings.jsx
Dashboard.jsx — Home; currently hardcoded widgets, target is
config-driven (see "Module registry & configuration" above)
Calendar.jsx — Gregorian+Hijri grid + full reminders CRUD
Timetables.jsx, Habits.jsx
Academics.jsx — legacy Subjects -> Units -> Notes; kept, untouched,
being superseded in UX by Study.jsx but never auto-migrated
Study.jsx — CURRENTLY the old fixed Program->Subject->Content model;
being rebuilt on the generic nodes hierarchy, see PROJECT_STATUS.md
Pomodoro.jsx, Exercise.jsx — feature-specific, own collections
Tasks.jsx — file + data intact, NOT currently routed/in nav; restore
via the module/config system when built, not by re-adding blindly
ComingSoon.jsx — placeholder for not-yet-built routes
App.jsx — routing + Gate component (auth check -> profile check -> render)


## Firestore data model

All data lives under `users/{uid}/...`. Current collections:

users/{uid}/profile/main { name, hijriAdjustmentDays, createdAt }
users/{uid}/meta/habitList { habits: [{id, name}] }
users/{uid}/meta/seeded { seededAt } — guards one-time seed
users/{uid}/habitLogs/{YYYY-MM-DD} { [habitId]: true }
users/{uid}/subjects/{id} { name, type: 'backlog'|'sem5',
units: [{id,name,topics,notes,done}] }
users/{uid}/tasks/{id} { title, category, dueDate, completed,
completedAt, createdAt }
users/{uid}/deadlines/{id} { title, date, type }
users/{uid}/reminders/{id} { title, description, date, time, type,
repeat, createdAt }


Also live: `timetables/{id}`, `timetableCompletions/{date}`,
`pomodoroSessions/{id}`, `exerciseLogs/{id}`, `weightLogs/{date}`.

`studyPrograms/{id}`, `studySubjects/{id}`, `studyContents/{id}` also
currently exist (written by `Study.jsx`) but are being replaced — see
"Generic node system" above. Do not add new fields or features to these
three collections; new Study/Work work happens on `nodes` instead.

Planned (not yet built — see PROJECT_STATUS.md): `nodes/{nodeId}`,
`nodes/{nodeId}/values/{date}`, `config/main`.

## Design system

- Colors (Tailwind config, do not introduce ad-hoc hex values elsewhere):
  `ink` (950-500, dark backgrounds), `parchment` (100-300, text),
  `brass` (400-600, primary accent/CTA), `teal` (400-600, success/on-track),
  `clay` (400-600, urgent/danger)
- Fonts: `font-display` (Source Serif 4, headings), `font-body` (Inter, everything else)
- Card pattern: use the `.card` utility class (`bg-ink-800 border border-ink-600/60 rounded-card shadow-card`)
- Icons: lucide-react only, size 16-18 inline

## Testing discipline (required before handing off any batch)

1. `npm run build` must complete with 0 errors (warnings about chunk size are fine, ignore).
2. `npx oxlint src/` should show 0 errors (pre-existing warnings about
   `useAuth` fast-refresh and similar are known and fine to ignore).
3. Manually reason through the feature's logic — e.g. recurrence math for
   reminders was verified with node one-off scripts before shipping, not
   just "looks right." For anything touching `src/domain/`, run the
   committed scripts in `scripts/` (`node scripts/test-progress.mjs`,
   `node scripts/test-nodeTree.mjs`) and add new cases there rather than
   one-off, uncommitted verification — these are meant to accumulate.
4. Never claim something is tested/working without actually running the
   build command in this session.

## Git & deploy commands (for reference — user runs these, not Claude)

```powershell
npm install
npm run dev        # test locally first
npm run build
firebase deploy
git add .
git commit -m "..."
git push
```

Firebase project alias: `default` -> `anas-os`. Local project folder:
`C:\Users\rexy2\anas-os` (moved out of Downloads to avoid duplicate-folder
issues encountered earlier in development).