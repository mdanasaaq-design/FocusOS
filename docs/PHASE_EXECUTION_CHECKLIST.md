# FocusOS — Phase Execution Checklist

**Purpose:** Practical phase gates derived from `docs/PROJECT_AUDIT_AND_PHASE_PLAN.md`.  
**Rule:** Checking a box requires evidence. The planning PR is merged; subsequent phases may change application code on focused branches. Deployment requires a separate risk review and explicit verification.

## Phase 0 — Documentation and repository hygiene
- [x] Merge the comprehensive audit/phase plan as a docs-only change (PR #36, merge commit `a0496ae`).
- [x] Reconcile current status, roadmap, verification, durable memory, and changelog with current phase status; historical FOS-001–FOS-038 disposition mapping remains open.
- [ ] Compare stale open PR #21 against main and list only still-missing unique work; retain for selective review of migration and hierarchy work.
- [x] Review PR #8's product-direction notes and selected UI changes against current `main`; useful changes were reimplemented and merged in PR #43. PR #8 is closed as superseded; PR #14 is also closed.
- [x] Resolve issue #7's CI status-tracking concern; push-triggered runs are observable through Actions API (issue #7 closed).
- [ ] Map historical FOS-001–FOS-038 findings to current disposition without rewriting history. Start with high-risk items (Page lifecycle, invalid timezone/locale, date keys/recurrence, Focus persistence, activity query limits, legacy Dashboard sources) and cite current code/tests for each disposition.

## Phase 1 — Release baseline and production truth
- [x] Record latest main SHA and successful CI run (merge commit `a0496ae`; verify run `39115347759` passed lint, tests, build, Firestore rules, and emulator-backed E2E).
- [ ] Establish whether the exact main SHA is deployed to Hosting; record evidence, not assumption. **Blocked:** smoke run `39115347777` passed against the existing URL but the workflow has no deploy step, and no deployment provenance was available.
- [ ] Verify deployed Firestore rules/configuration through an authorized workflow. **Blocked:** repository rules are visible; deployed rules have not been independently inspected.
- [ ] Review current lint warnings and classify actionable warnings.
- [ ] Reconcile or explicitly justify Node 24 in CI versus Node 22 in Cloud Smoke; difference confirmed, rationale not yet documented.
- [x] Confirm smoke workflow runs its configured smoke test file and records test discovery (`production-smoke.yml` lists and runs `playwright.smoke.config.mjs`).
- [ ] Decide deployment timing only after risk review; do not deploy as part of the planning phase.

## Phase 2 — Data integrity and lifecycle
- [x] Page deletion matrix: preserve Node documents, Node activity/history, Node values, legacy activity-backed Tasks, reminders, timetables/completions, deadlines, habits/logs, Focus/Pomodoro sessions, exercise logs, and surviving Page associations. Verified by PR #39 final CI run `39116461546` (emulator-backed E2E).
- [ ] Inject a reference-detachment failure and prove Page documents are not deleted; validate retry/reconciliation after partial detach. The contract test verifies deletion aborts when any collection cleanup fails; emulator-backed retry/reconciliation coverage remains open.
- [ ] Prove surviving Page associations remain intact after deleting one of multiple associated Pages.
- [ ] Test legacy `pageId`-only records and normalized `pageIds` associations.
- [ ] Test root/descendant Trash timestamps and mixed retention windows.
- [x] Test Page subtree restore/trash/delete with nested descendants and invalid IDs (unit and emulator-backed E2E coverage; see `CURRENT_VERIFICATION.md`).
- [x] Pure tests cover Node parent/path invariants, cycle/missing-parent rejection, and path reconstruction. Emulator-backed repair behavior remains to verify.
- [ ] Test Page reparent/reorder does not rewrite Node relationships or record ownership.
- [ ] Test chunked writes and document recovery behavior after partial failure. Pure tests cover 450-write chunking and retry planning after a simulated partial commit; actual Firestore chunk-failure recovery remains open.
- [x] Page deletion preserves Node documents and Node activity/value subcollections in emulator-backed E2E. Node-document deletion policy remains a separate lifecycle decision.

## Phase 3 — Tool registry and record/view architecture
- [ ] Build an inventory of every registry key: UI entry, runtime status, supported context, actual record collection, configuration schema, and test coverage.
- [ ] Verify standalone and embedded views operate on the same records.
- [ ] Verify filters/sorting/grouping/layout/visible fields do not mutate records or other views.
- [ ] Test Task migration dry run, additive copy, deterministic IDs, idempotency, deduplication, update mirroring, rollback, and metadata preservation.
- [ ] Define separate migration plans for Habits, Focus sessions, Exercise/Measurements, Goals, and other specialist records.
- [ ] Decide the explicit import/retirement path for legacy Study/Work and academic collections.
- [ ] Do not remove legacy data/routes until replacement and rollback are verified.

## Phase 4 — Core functional workflows
- [x] Product-alignment regressions: Dashboard clock outside the widget grid; Calendar selected-day details visible; Task priority required and optional estimate persisted; Habit reminder time required. PR #43 head CI and emulator-backed E2E passed; full manual/responsive verification remains open.
- [ ] Page creation, editing, ordering, navigation visibility, child nesting, reparenting, archive, Trash, restore, permanent delete.
- [ ] Node create/edit/reparent/archive and descendant navigation/history/values.
- [ ] Tool discovery/launch and Page placement add/remove/configure.
- [ ] Tasks create/edit/complete/reopen, status/priority, due date, associations, refresh and re-login.
- [ ] Calendar events, recurrence, filtering, preferences, and Page/Node associations.
- [ ] Timetable creation, conflict detection, completion, recurrence, and Calendar relationship.
- [ ] Habits completion, streaks, reminders, history, and configured day semantics.
- [ ] Focus/Pomodoro pause/resume, expiry, reload, completion, and duplicate prevention.
- [ ] Exercise/Measurements/Goals progress and history consistency.
- [ ] History edit/hide/undo/export semantics and backup completeness.
- [ ] Onboarding and Settings persistence, invalid values, save failures, and unsaved edits.
- [ ] Audit all visible buttons, links, toggles, menus, forms, and destructive actions.

## Phase 5 — Dates, timezone, preferences
- [ ] Verify day keys and recurrence at UTC/local midnight, including Asia/Kolkata.
- [ ] Verify invalid/missing timezone and locale normalization on old profiles.
- [ ] Verify time zone, date/time formats, first day of week, and Hijri adjustment/fallback.
- [ ] Verify language/RTL and accessibility preferences across major routes.
- [ ] Confirm existing records are not silently rewritten by preference normalization.

## Phase 6 — UX, accessibility, performance
- [ ] Test 320px, 375px, 768px, and desktop layouts with long text, nested navigation, dialogs, forms, and grids.
- [ ] Complete keyboard-only navigation and visible focus pass.
- [ ] Check accessible names, semantic headings, labels, dialogs, target sizes, contrast, and reduced motion.
- [ ] Verify loading, empty, success, validation, permission-denied, offline, and failure states.
- [ ] Measure current production bundle; only then decide whether to split the authentication chunk.
- [ ] Remove/redirect obsolete routes and stale links only after dependency/usage inventory.

## Phase 7 — Migration and legacy retirement
- [ ] For each tool migration, define backup, dry run, additive copy, idempotency, count/identity/history verification, rollback, and retirement window.
- [ ] Verify migration using disposable/emulator data before any real-data use.
- [ ] Require explicit user action for migration; never run data migration automatically at login/startup.
- [ ] Keep old collections intact until the retention decision and release window are complete.
- [ ] Document every legacy route/component/collection as keep, adapt, redirect, or retire.

## Phase 8 — Release candidate
- [ ] Full CI passes: lint, unit/domain tests, production build, Firestore rules, emulator E2E.
- [ ] Review diff, warnings, security/data risks, and skipped checks.
- [ ] Confirm backup/export and rollback readiness for any data-affecting release.
- [ ] Deploy the approved main SHA through the authorized workflow.
- [ ] Record exact deployed revision and deployment evidence.
- [ ] Run production smoke against the deployed version.
- [ ] Perform authenticated spot checks and record results in `CURRENT_VERIFICATION.md`.
- [ ] Update `PROJECT_STATUS.md`, `tasks.md`, and `CHANGELOG.md`; do not claim production-ready if a required gate remains open.

## Phase 9 — Optional expansion
- [ ] Score candidate ideas by user value, architecture fit, risk, and maintenance cost.
- [ ] Keep Awwab deferred until stable domain APIs and permission boundaries are documented and tested.


## Execution update — 2026-10-18
- Phase 0 plan is merged and issue #7 is closed. Phase 0 remains partially open for PR #21 item-level reconciliation and historical FOS-001–FOS-038 disposition mapping; PR #8 is closed as superseded.
- Phase 1 source CI and existing-site smoke evidence are recorded, but exact deployed source SHA and deployed Firestore rules remain unverified. No deployment was performed.
- Phase 2 PR #39 (all-known-record-family Page cleanup) and PR #40 (Node path repair/reparent recovery) are merged after successful CI. PR #40's real Firestore partial-write/retry behavior remains an explicit test gate.


## Phase 0 triage checkpoint — 2026-10-18
- Open PR inventory after PR #43 merged: PR #21 remains open for item-level review. PR #8 was closed as superseded after selected UX changes were ported in PR #43; PR #14 is not open. Issue #7 is closed after CI status visibility was verified.
- PR #21 is not merge-ready (`mergeable: false`) and contains overlapping architecture/lifecycle changes. Preserve only deltas proven absent from main; its data-model/migration material and authentication logout/re-login E2E deserve a fresh isolated review.
- PR #8 is closed as superseded. Its useful UX requirements now live in `PRODUCT_DIRECTION.md` and selected changes are merged through PR #43. Do not treat its old completion checklist as current test evidence.
- Historical FOS backlog remains a separate disposition task; the audit text is retained unchanged pending item-by-item evidence mapping.
