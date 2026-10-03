# PROJECT_STATUS.md

**Last updated:** 2026-10-04
**Last updated by:** FocusOS 1.0 quality and architecture consolidation pass.

This file is the single source of truth for "where are we right now." Every
session must update this before finishing. Keep entries factual and terse —
detailed history belongs in CHANGELOG.md, not here.

---

## Architecture foundation (2026-09-03) — READ THIS FIRST

FocusOS's direction changed: it is no longer a fixed student-productivity
app but a customizable personal operating system (see CLAUDE.md's "What
this project is"). This followed a multi-round architecture design
process and an audit of a commit (`99fb1ca`, "feat: implement study
pomodoro and exercise modules") that had built Study/Work, Pomodoro, and
Exercise using the *old* architectural assumption (a fixed
`studyPrograms → studySubjects → studyContents` schema) because that old
assumption was still what `CLAUDE.md` documented at the time — this was
not a mistake by whoever built it, it was a documentation gap. This
session corrects that gap and lays the foundation for the real rebuild.

**What this session did:**
1. Removed the unconditional, automatic `migrateAcademicsToStudy()` call
   from `App.jsx`'s login/startup flow (`Gate`). It ran on every login
   with no user consent and wrote hardcoded labels ("B.Tech", "(Backlog)",
   "(Sem 5)") into new documents. The function itself was renamed to
   `migrateAcademicsToStudy_DISABLED_DO_NOT_CALL` in `src/lib/data.js` and
   heavily commented — kept as a reference for what NOT to do, not deleted,
   in case any of its logic is useful to look at when building the real
   import feature later.
2. Added `src/domain/progress.js` and `src/domain/nodeTree.js` — pure,
   `node`-testable contracts for the generic node hierarchy and progress
   calculation (see CLAUDE.md "Generic node system"). Verified with
   `scripts/test-progress.mjs` and `scripts/test-nodeTree.mjs` — all
   passing (41 assertions total).
3. Added `src/modules/registry.js` — the closed, FocusOS-controlled list
   of toggleable capabilities. Metadata only; not yet wired into
   `Sidebar.jsx` or `Dashboard.jsx`.
4. Corrected `CLAUDE.md` throughout — removed the stale "Study Program →
   Subject → Content" instruction, added the locked architecture
   decisions (generic nodes, module registry, configuration, layering
   direction), corrected the architecture map and data model sections to
   match what's actually in the repo.

**What this session deliberately did NOT do** (out of scope for this
pass — see "Next Task" below for who does this and when):
- Did not build `src/data/nodes.js` (Firestore CRUD for `nodes`).
- Did not touch `Study.jsx`, `Pomodoro.jsx`, `Exercise.jsx`, or
  `Dashboard.jsx` — all still function exactly as before, on the old
  fixed schema, unchanged and unbroken.
- Did not delete `studyPrograms`/`studySubjects`/`studyContents` or any
  data within them.
- Did not touch `subjects` (Academics data) — never at risk, confirmed
  again this session.
- Did not restore Tasks to navigation — that's a config-driven decision
  pending `config/main` existing (Next Task).
- Did not build `config/main` or wire the module registry into any UI.

**Data risk needing your action, not mine:** if `migrateAcademicsToStudy`
already ran against your real account before this fix (check for
`users/{your-uid}/meta/studyMigrated` in the Firebase console — I don't
have credentials to check this myself), there may already be an
auto-created "B.Tech" `studyPrograms` document with corresponding
`studySubjects`/`studyContents` in your live data. It's inert now (the
function can't run again since it's no longer called), but you should
decide whether to leave it in place (harmless, unused) or delete it
(safe to delete — it's not `subjects`, which is never touched). See
CHANGELOG.md for the full context.

---

## Current stabilization status (2026-10-04)

- [x] Configured timezone is propagated into Page runtime dates and field-value day selection.
- [x] Page activity subscriptions are scoped by `pageId` at the Firestore query layer.
- [x] Composite Firestore index added for Page activity `pageId + date`.
- [x] FocusOS backup export restored to include profile, Pages, activity, Nodes and Node history, capabilities, reminders, timetables, habits, legacy specialist records, and config.
- [x] Accidental literal `\\n` source corruption found in runtime/export files was repaired.
- [x] GitHub CI: lint, tests, and production build pass on the latest main commit.
- [ ] Deploy latest main commit to Firebase Hosting and perform production smoke testing.
- [ ] Add Firestore emulator/rules integration tests to CI.

## Completed

### Phase 1 (original build)
- [x] React + Vite + Tailwind + Firebase (Auth + Firestore + Hosting) scaffold
- [x] Command Center dashboard (deadlines, task/habit progress rings, streaks)
- [x] Academics: Subjects -> Units -> Notes, Backlog/Sem5 tagging
- [x] Tasks: categorized, due-dated, completed-history view
- [x] Habits: 30-day grid, auto streaks
- [x] Firestore security rules (per-uid isolation)
- [x] Deployed to Firebase Hosting, connected to GitHub

### Phase 2 — Batch 1: Profile, Home rebuild, Sidebar
- [x] First-login profile setup (name capture), Firestore-backed
- [x] Dynamic greeting (no hardcoded name)
- [x] Live configurable clock on Home (24-hour format by default; leading-zero seconds supported)
- [x] Hijri date display (with adjustable offset in Settings)
- [x] Collapsible sidebar (desktop toggle + localStorage persistence),
      mobile drawer
- [x] Settings page (name, Hijri adjustment)

### Phase 2 — Batch 2: Calendar
- [x] Gregorian month-grid calendar with Hijri date under every day
- [x] Month navigation, today highlighted
- [x] Hijri math verified against reference date (1 Muharram 1447 AH ≈ late June 2025)

### Phase 2 — Batch 3: Reminders + Recurrence
- [x] Reminder types: birthday, anniversary, exam, assignment, payment,
      personal, custom
- [x] Recurrence: never/daily/weekly/monthly/yearly, stored as structured
      data (not duplicated documents) — recurrence math unit-tested with
      5 scenarios before shipping
- [x] Calendar day markers (colored dots) for reminders, click-day panel,
      add/edit/delete modal
- [x] "Upcoming" reminders on both Calendar page and Home dashboard

### Phase 2 — Batch 4: Timetable system — CONFIRMED COMPLETE
Verified directly against current code (`src/lib/timetable.js`,
`src/pages/Timetables.jsx`, `src/components/TimePicker.jsx`,
`src/lib/data.js`).
- [x] Timetable creation: any number of named timetables, only one active
      at a time (`setActiveTimetable` batch-deactivates the rest)
- [x] Timetable editor: From / To / Task Name / Duration rows; duration is
      always derived (`entryDuration()`), never manually entered
- [x] Validation: scheduled vs unscheduled minutes out of 24h computed by
      `validateEntries()`; overlapping entries detected and flagged with a
      "Schedule Conflict" warning; gaps allowed
- [x] Completion is date-based history: `timetableCompletions/{date}`,
      keyed `${timetableId}:${entryId}` — not stored on the timetable
      document itself
- [x] Dedicated 12-hour `TimePicker` component for entry rows

New Firestore collections confirmed live:
`users/{uid}/timetables/{id}`, `users/{uid}/timetableCompletions/{date}`.

### Phase 2 — Batch 5A: FocusOS rebrand + Home/Dashboard redesign — CONFIRMED COMPLETE
- [x] Product renamed to "FocusOS" in the Sidebar header (old "Command
      Center" branding removed)
- [x] Dashboard rebuilt around a `StatCard`-based grid: Habits, Timetable
      Follow, Tasks, and a new Namaz (5 daily prayers) tracker
- [x] Namaz tracking added: `prayerLogs/{date}` collection, `PRAYERS`
      constant, `setPrayerLog()` — not previously documented in CLAUDE.md's
      data model section
- [x] Dashboard now also surfaces "Timetable Follow" progress for today's
      active timetable, pulling from `timetableCompletions`

### Phase 2 — Batch 5B: Calendar compaction — CONFIRMED COMPLETE (no prior changelog entry)
No changelog entry exists for this batch; the following is inferred from
reading the current `src/pages/Calendar.jsx` and cannot be attributed to a
specific date.
- [x] Calendar grid uses compact cell sizing (`h-11 sm:h-12`) and small
      text (`text-[11px]` day numbers)
- [x] Two-column layout: month grid + side panel (selected-day detail,
      Upcoming list) fit together without excess whitespace

### Phase 2 — Batch 5C: Timetable UX — CONFIRMED COMPLETE (no prior changelog entry)
No changelog entry exists for this batch; the following is inferred from
reading the current `src/pages/Timetables.jsx`,
`src/components/TimePicker.jsx`, and `src/lib/timetable.js`.
- [x] Dedicated hour/minute/AM-PM `TimePicker` component replacing raw
      time inputs
- [x] Conflict/validation summary bar in the timetable editor: scheduled /
      unscheduled / conflict minutes shown as a segmented progress bar,
      plus inline warning text for conflicts and invalid rows

### Phase 2 — Study/Pomodoro/Exercise — ARCHITECTURE MIGRATION COMPLETE
- [x] Pomodoro retains its feature-specific session history and now links focus sessions to Universal Nodes through `linkedNodeId`.
- [x] Study/Work rebuilt on the generic `nodes` hierarchy with arbitrary nesting and recursive tree management.
- [x] Existing legacy study collections remain untouched as a compatibility/data-preservation fallback.
- [x] Automatic Academics→Study migration remains disabled and is never triggered during login.
- [x] Tasks remain available in their existing Firestore collection but are not forced into navigation; module visibility is configuration-driven.

### Branding
- [x] Logo mark designed (geometric "A" monogram, brass/teal, matches
      progress-ring visual language) — applied to Sidebar, Login,
      ProfileSetup, and favicon.svg
- [x] Removed leftover "Command Center" / old tagline branding from Login
      page (was missed in Batch 1, caught during logo work)

### Infrastructure / process
- [x] Git repo cleaned up and re-established at
      `C:\Users\rexy2\anas-os` (previous folder/history chaos resolved —
      see CHANGELOG.md for what happened)
- [x] Multi-session collaboration docs created (this file, CLAUDE.md, CHANGELOG.md)

### Architecture foundation (2026-09-03) — see full note above
- [x] Automatic Study migration removed from startup flow
- [x] `src/domain/progress.js` — generic progress calculation contract, tested
- [x] `src/domain/nodeTree.js` — generic hierarchy/path contract, tested
- [x] `src/modules/registry.js` — closed module registry (metadata only)
- [x] `CLAUDE.md` corrected to reflect the approved FocusOS architecture

---

## Audit implementation status — FocusOS GPT audit follow-through

The audit implementation pass is complete on branch `fix/page-deletion-integrity`.

- [x] Page deletion removes Page activity, descendant Pages, related Nodes, nested Node activity, and nested Node values with bounded Firestore batches.
- [x] Error feedback was added to the main Page/runtime and legacy specialist write flows touched by the audit.
- [x] Accessibility fixes were added for key search, form, checkbox, and destructive-action controls.
- [x] Shared Page capability activity exists as the canonical activity path for the generic Page runtime while specialist feature-specific collections remain intact.
- [x] Specialist surfaces remain preserved; no feature data was deleted merely to simplify navigation.
- [x] Documentation now reflects that the generic Node data layer exists.
- [x] Local verification completed after the latest pull: `npm run lint` = 0 errors / 13 warnings; `npm run build` = successful.

Known non-blocking limitations remain: the 30-day trash purge is app-triggered rather than server-scheduled, and a full Firestore integration test/emulator has not been added. The legacy Study/Work UI and `config/main` migration remain separate architectural follow-up work rather than being silently replaced during the audit.

## In Progress

Nothing actively in progress.

---

## Known Issues / Bugs

Identified during a documentation-sync inspection on 2026-09-02. Not yet
fixed — recorded here for a future session to address explicitly.

1. **Case-mismatched Logo import.** `src/components/Sidebar.jsx` imports
   `./Logo`, but the committed file is `src/components/logo.jsx`
   (lowercase). Currently works because it's being built on a
   case-insensitive filesystem (Windows), but is a latent break risk on
   case-sensitive builds/CI/deploy environments.
2. **Inconsistent StatCard filename.** `src/components/StartCard.jsx`
   exports a component named `StatCard`. The filename ("Start") doesn't
   match the export name ("Stat") — likely a typo from whenever this file
   was created during the 5A redesign.
3. **Possible dead code: ProgressRing.** `src/components/ProgressRing.jsx`
   is fully implemented and styled but is not imported anywhere in the
   current codebase. It appears to have been superseded by `StatCard`
   during the Batch 5A dashboard redesign and may now be dead code —
   needs a decision (remove vs. re-use) rather than a silent deletion.
4. **Stale environment reference info.** The "Environment Reference"
   section below previously listed the GitHub repo as
   `github.com/anasarsalan753-dev/anas-command-center`. The actual repo
   is `anasarsalan753-dev/anas-os`. Corrected below.
5. **Study/Work data model needs a full rebuild**, not a patch — see the
   "Study/Pomodoro/Exercise" entry above. Fixed 2-level schema, cannot
   represent required depth.
6. **`studyPrograms`/`studySubjects`/`studyContents` may already contain
   auto-migrated data** if `migrateAcademicsToStudy` ran against the live
   account before this session's fix. Needs a manual check — see
   "Architecture foundation" note above.
7. **Pomodoro's `programId`/`subjectId` fields** are coupled to the
   flawed Study schema (see issue 5) and will need to become
   `linkedNodeId` once Study/Work is rebuilt.
8. **Tasks unrouted.** `Tasks.jsx` and its `data.js` functions are intact
   but not reachable from the UI. Correct fix is a `config/main`-driven
   toggle (once built), not simply re-adding the route/nav link
   unconditionally.

---

## Phase 1 complete (2026-09-03) — Generic Node Data Layer

Account 1 had not yet started `src/data/nodes.js` when it hit its usage
limit. This session (a temporary takeover, per explicit instruction)
implemented it from scratch against the existing, already-tested
`src/domain/nodeTree.js` and `src/domain/progress.js` contracts.

**Added:**
- `src/data/nodes.js` — full Firestore CRUD for `users/{uid}/nodes/{id}`
  and `users/{uid}/nodes/{id}/values/{date}`: `addNode`, `getNode`,
  `updateNode`, `archiveNode`, `deleteNode`, `getNodes`/`subscribeNodes`
  (module + archived filtering), `rootNodes`, `reparentNode` (cycle
  prevention, descendant path updates, cross-module-move prevention),
  `setNodeValue`/`getNodeValue`/`subscribeNodeValue`/`getNodeValueRange`.
  Delegates all hierarchy/path math to `domain/nodeTree.js` and all
  tracking-type validation to the new `data/nodeValidation.js` — does not
  reimplement either.
- `src/data/nodeValidation.js` — pure (`node`-testable) validation split
  out of `nodes.js` specifically for testability: `assertValidModuleKey`,
  `assertValidTracking`, `normalizeTracking`, `isValidNodeName`.
- `scripts/test-nodeValidation.mjs` — 19 assertions, all passing.

**Changed:**
- `src/modules/registry.js` — added `isNodeModule` flag to `MODULES`
  entries (only `study` is currently `true`) and derived
  `NODE_MODULE_KEYS`/`isValidNodeModuleKey()` from it. This was necessary
  to give `nodes.js` a real source of truth for valid node `moduleKey`
  values without creating a second, competing list — `registry.js`'s
  original `MODULES` list is nav-level capabilities (includes
  `pomodoro`, `tasks`, etc.), which is a different, broader set than
  valid node `moduleKey`s; validating against the wrong list would have
  let a node be created with `moduleKey: "pomodoro"`. See the file's
  updated header comment for the full explanation.

**Known, honestly-recorded test gap:** `nodes.js` itself (the actual
Firestore calls) has NOT been executed against a live or emulated
Firestore — there is no test framework or Firestore emulator set up in
this environment, and setting one up was judged out of scope for this
pass. It was verified by: (1) `node --check` (syntax), (2) a temporary,
reverted import into `main.jsx` to confirm Vite's actual build pipeline
resolves the full import chain (`nodeValidation.js` → `domain/nodeTree.js`
+ `domain/progress.js` + `modules/registry.js`, plus `lib/firebase.js` +
`lib/dates.js`) with zero errors, and (3) code review against the
already-tested `nodeTree.js`/`progress.js` contracts it delegates to.
The genuinely pure, extractable parts (moduleKey validation, tracking
validation/normalization, name validation) ARE unit-tested — see
`scripts/test-nodeValidation.mjs`. This mirrors existing project
precedent: `src/lib/data.js` has never had direct unit tests for the
same underlying reason (it also transitively depends on
`import.meta.env` via `lib/firebase.js`); only its pure logic
(`dates.js`, `reminders.js`, `timetable.js`) was ever testable this way.
**A real integration test against Firestore (emulator or a scratch
project) is recommended before `nodes.js` is relied on for anything
user-facing** — flagging this explicitly rather than overstating
confidence.

**Verification performed:** `npm run build` (0 errors, both with and
without a temporary forced import to confirm bundling — see above),
`npx oxlint src/ scripts/` (0 errors, 4 pre-existing warnings, unchanged
from before this session), all 4 test scripts passing
(`test-nodeTree.mjs`, `test-progress.mjs` — both unchanged from last
session and still passing — plus the new `test-nodeValidation.mjs`).

**Explicitly not touched this session** (per instruction — Phase 2+):
`Study.jsx`, `Pomodoro.jsx`, `Exercise.jsx`, `Dashboard.jsx`,
`Sidebar.jsx`, `Tasks.jsx`, `App.jsx`, `config/main`, `firestore.rules`,
any migration/import feature, any UI wiring of the module registry.

---

## Next Task

**1. Rebuild Study/Work on Universal Nodes.** Replace the superseded fixed
studyPrograms → studySubjects → studyContents runtime with arbitrary-depth
Nodes while preserving the legacy collections as read-only fallback until
migration is verified.

**2. Re-link focus sessions to Nodes.** Add a generic `linkedNodeId` relationship
for Pomodoro/focus history without deleting existing history.

**3. Complete capability-driven configuration.** Finish the config/main contract
so navigation, dashboard widgets, and optional legacy modules are controlled
by validated configuration rather than hardcoded UI decisions.

**4. Add Firestore integration verification.** Use the Firebase emulator or a
throwaway test project for Node CRUD, security rules, and history integrity.

**5. Production smoke test.** Deploy the green main commit and verify auth,
refresh persistence, Pages, dashboard, calendar, responsive navigation, and
settings on the live site.

## Environment Reference

- Firebase project: `anas-os` (alias `default`)
- Live URL: `https://anas-os.web.app`
- GitHub repo: `github.com/anasarsalan753-dev/anas-os` (private) —
  corrected 2026-09-02; previously misrecorded as `anas-command-center`
- Local project folder: `C:\Users\rexy2\anas-os`
