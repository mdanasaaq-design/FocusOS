# PROJECT_STATUS.md

**Last updated:** 2026-10-18  
**Last updated by:** Comprehensive repository audit and phase-planning documentation.

This file is the single source of truth for current project state. Detailed findings and the phase sequence live in [the comprehensive audit and phase plan](docs/PROJECT_AUDIT_AND_PHASE_PLAN.md); actionable gates live in [the phase execution checklist](docs/PHASE_EXECUTION_CHECKLIST.md).

## Current repository status — 2026-10-18

- Audited baseline: `main` at [`2818f03c45384e9fe2e97e92e4a4c265098470d3`](https://github.com/mdanasaaq-design/FocusOS/commit/2818f03c45384e9fe2e97e92e4a4c265098470d3).
- Latest observed main CI [run 38890113167](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38890113167) passed on that commit.
- PR #33 (Page reference safety), #34 (repository rules/docs), and #35 (Page E2E/docs alignment) are merged.
- Permanent Page-subtree deletion detaches references from Nodes, legacy activity, and specialist Tasks before deleting Page documents; specialist records and associations to surviving Pages are intended to remain.
- The current source revision is **not confirmed deployed** to Firebase Hosting. The successful smoke workflow tests the existing deployed URL and does not deploy source.
- The latest review was documentation/planning only. No application source, build, or deployment was changed or run during this audit.
- Open stale-work items require triage: PR #21, #14, #8, and issue #7. Do not merge older branches without comparing their unique changes against current main.
- Current next phase: Phase 1 — establish source/deployment/rules baseline, after the documentation-only plan is reviewed and merged.

## Current status summary

| Area | Status | Next action |
|---|---|---|
| Tool Registry, launcher, Page tool-view placements, global defaults | Implemented foundation; broader parity incomplete | Inventory actual runtime and record model for every tool |
| Task views and specialist Task storage/migration | Partially implemented; CI coverage exists | Verify migration edge cases and define migration contracts for other tools |
| Page lifecycle and Task reference cleanup | Implemented and CI-verified | Expand Node/history/other-record preservation coverage |
| Page and Node hierarchy integrity | Domain safeguards exist | Verify emulator-backed edge cases, path repair and partial-write recovery |
| Firestore owner-only rules | Emulator-verified in recent CI | Verify deployed rules match intended repository rules |
| Automated CI | Latest observed main run passed | Keep full CI as phase/release gate |
| Production deployment provenance | Unverified for audited main SHA | Establish exact deployed revision before release claims |
| Mobile/accessibility/localization | Partial remediation; broad verification outstanding | Execute responsive and accessibility matrix |
| Specialist collection migration | Tasks foundation only; other models remain mixed/legacy | Inventory and migrate one domain at a time, reversibly |
| Awwab | Deferred | Revisit only after stable permission-checked domain APIs |

## Planning documents

- `docs/PROJECT_AUDIT_AND_PHASE_PLAN.md` — findings register, confidence/status distinctions, dependencies, and Phase 0–9 plan.
- `docs/PHASE_EXECUTION_CHECKLIST.md` — concrete exit gates for each phase.
- `CURRENT_VERIFICATION.md` — evidence and release/deployment facts.
- `tasks.md` — implementation backlog.
- `docs/DECISIONS.md` — durable product/architecture/process decisions.
- `CHANGELOG.md` — meaningful changes, including this documentation-only planning update.

---

## Architecture foundation (2026-09-03) — see full note above
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

### Phase 0 — Stabilize the current repository (P0)
1. [x] Fix PR #33's Page-deletion lifecycle contract: detach deleted Page references from Nodes, activity, and specialist Tasks while preserving records and surviving associations.
2. [x] Run full CI on the fix: lint, tests, build, Firestore owner-only rules, and emulator-backed Playwright regression tests passed.
3. [x] Merge the documentation-governance changes in PR #34 after full CI passed.
4. [ ] Confirm a successful production smoke run against the existing Hosting URL and distinguish it from verification of the latest source commit.
5. [ ] Plan the next deployment only after reviewing the current production/data boundary; no deployment was performed as part of this work.

### Phase A — Complete documentation and product contract
1. Keep `README.md`, `AGENTS.md`, `rules.md`, `prd.md`, `architecture.md`, `design.md`, `docs/DECISIONS.md`, `tasks.md`, `memory.md`, `CLAUDE.md`, `PROJECT_STATUS.md`, and `CURRENT_VERIFICATION.md` consistent.
2. Treat audit documents as historical findings/reference; do not rewrite them to imply unresolved findings never existed.
3. Update affected documents in the same change as product, architecture, design, status, or verification changes.

### Phase B — Functional cleanup
1. Remove or redirect legacy Workspace routes and stale links without deleting user data.
2. Inventory visible buttons, links, form submissions, toggles, and destructive actions; make each work, remove it, or clearly mark it unavailable.
3. Resolve duplicate/legacy UI that conflicts with the Page/Node architecture without removing working functionality prematurely.
4. Verify Page creation, configuration, navigation visibility, capability binding/runtime, history, Dashboard widgets, and Settings persistence.
5. Verify supported specialist surfaces: Calendar, Timetables, Habits, Pomodoro, Exercise, and Tasks.

### Phase C — Integrated verification and release
- Run the complete test suite, production build, and Firestore rules/emulator tests.
- Perform authenticated browser, persistence, mobile/responsive, and accessibility checks.
- Verify the deployed commit and smoke-test production before release sign-off.

## Environment Reference

- Firebase project: `focusos-7cd08` (alias `default`)
- Live URL: `https://focusos-7cd08.web.app`
- GitHub repo: `github.com/mdanasaaq-design/FocusOS`
- Local project folder: environment-specific; do not assume a fixed path.
