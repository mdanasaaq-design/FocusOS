# FocusOS — Phase Execution Checklist

**Purpose:** Practical phase gates derived from `docs/PROJECT_AUDIT_AND_PHASE_PLAN.md`.  
**Rule:** Checking a box requires evidence. The planning PR is merged; subsequent phases may change application code on focused branches. Deployment requires a separate risk review and explicit verification.

## Phase 0 — Documentation and repository hygiene
- [x] Merge the comprehensive audit/phase plan as a docs-only change (PR #36, merge commit `a0496ae`).
- [ ] Reconcile current status, roadmap, verification, durable memory, and changelog with the audited main SHA.
- [ ] Compare stale open PR #21 against main and list only still-missing unique work.
- [ ] Review PRs #14 and #8; close or supersede only after confirming no unique useful change is lost.
- [ ] Resolve issue #7's CI status-tracking concern based on current observable push-triggered runs.
- [ ] Map historical FOS-001–FOS-038 findings to current disposition without rewriting history.

## Phase 1 — Release baseline and production truth
- [x] Record latest main SHA and successful CI run (merge commit `a0496ae`; verify run `39115347759` passed lint, tests, build, Firestore rules, and emulator-backed E2E).
- [ ] Establish whether the exact main SHA is deployed to Hosting; record evidence, not assumption. **Blocked:** smoke run `39115347777` passed against the existing URL but the workflow has no deploy step, and no deployment provenance was available.
- [ ] Verify deployed Firestore rules/configuration through an authorized workflow. **Blocked:** repository rules are visible; deployed rules have not been independently inspected.
- [ ] Review current lint warnings and classify actionable warnings.
- [ ] Reconcile Node versions between CI and production smoke (Node 24 vs Node 22), or document the reason for the difference.
- [ ] Confirm smoke workflow runs its intended production test file and records test discovery clearly.
- [ ] Decide deployment timing only after risk review; do not deploy as part of the planning phase.

## Phase 2 — Data integrity and lifecycle
- [ ] Page deletion matrix: preserve Node documents, Node activity/history, Node values, legacy activity, dedicated Tasks, Habits, Focus sessions, reminders, and unrelated records.
- [ ] Prove surviving Page associations remain intact after deleting one of multiple associated Pages.
- [ ] Test legacy `pageId`-only records and normalized `pageIds` associations.
- [ ] Test root/descendant Trash timestamps and mixed retention windows.
- [ ] Test Page subtree restore/trash/delete with nested descendants and invalid IDs.
- [ ] Test Node parent/path invariants, cycles, missing/archived parents, and path repair.
- [ ] Test Page reparent/reorder does not rewrite Node relationships or record ownership.
- [ ] Test chunked writes and document recovery behavior after partial failure.
- [ ] Decide/document whether Node subcollections are intentionally retained after a Node document is detached/deleted.

## Phase 3 — Tool registry and record/view architecture
- [ ] Build an inventory of every registry key: UI entry, runtime status, supported context, actual record collection, configuration schema, and test coverage.
- [ ] Verify standalone and embedded views operate on the same records.
- [ ] Verify filters/sorting/grouping/layout/visible fields do not mutate records or other views.
- [ ] Test Task migration dry run, additive copy, deterministic IDs, idempotency, deduplication, update mirroring, rollback, and metadata preservation.
- [ ] Define separate migration plans for Habits, Focus sessions, Exercise/Measurements, Goals, and other specialist records.
- [ ] Decide the explicit import/retirement path for legacy Study/Work and academic collections.
- [ ] Do not remove legacy data/routes until replacement and rollback are verified.

## Phase 4 — Core functional workflows
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
