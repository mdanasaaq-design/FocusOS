# FocusOS — Comprehensive Repository Audit and Phased Plan

**Audit date:** 2026-10-18  
**Audited baseline:** `main` at `2818f03c45384e9fe2e97e92e4a4c265098470d3`  
**Scope:** Repository, documentation, open PRs, recent CI evidence, architecture and release gaps.  
**Execution constraint:** Planning/documentation only. No application source changes, builds, tests initiated by this audit, or deployment.

## 1. Executive assessment

FocusOS has moved beyond its initial fixed-product structure. The current direction is a configurable personal operating system built from Pages, Nodes, reusable Tools, specialized records, and configurable views. Recent work has established a Tool Registry and launcher, multiple Page tool-view placements, global tool defaults, configurable Task views, Task editing/filtering, safer Page hierarchy operations, Page Trash lifecycle safeguards, and owner-only Firestore rules tests.

**The project is not yet ready to be called fully complete or production-verified.** The latest source commit has a successful GitHub CI run, but the current source revision is not confirmed deployed to Firebase Hosting. Several product and architecture requirements remain partially implemented or insufficiently verified. Specialist data remains mixed between a dedicated Tasks collection and the legacy generic activity collection. The open PR list also contains older work that must be reconciled rather than merged blindly.

This plan separates:
- **Confirmed state:** directly supported by repository or GitHub evidence.
- **Known gap:** documented and not yet closed by sufficient evidence.
- **Risk to investigate:** plausible issue requiring focused review/reproduction before calling it a defect.
- **Future idea:** optional product direction, not a release blocker.

## 2. Baseline and evidence

- Repository: [mdanasaaq-design/FocusOS](https://github.com/mdanasaaq-design/FocusOS)
- Audited main commit: [`2818f03`](https://github.com/mdanasaaq-design/FocusOS/commit/2818f03c45384e9fe2e97e92e4a4c265098470d3)
- Latest observed main CI: [run 38890113167](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38890113167) — successful on the audited commit.
- Recent Page lifecycle CI: [run 38887992252](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38887992252) — successful full verification on PR #33's head.
- Recent documentation-governance CI: [run 38887659029](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38887659029) — successful.
- Recent production smoke: [run 38888367048](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38888367048) — successful against the existing Hosting URL, but it does not deploy or prove the latest source commit is live.
- Firebase project: `focusos-7cd08`; production URL: https://focusos-7cd08.web.app
- PR #33 (Page reference cleanup) and PR #34 (repository documentation/rules) are merged. PR #35's Page E2E/documentation alignment is also merged into main.
- No deployment of the audited main commit is evidenced by the inspected repository records.

### Evidence limits

This was a repository and GitHub-state audit, not a live authenticated browser session against production or a review of real user Firestore data. A successful CI run proves the checks in that workflow passed for that revision; it does not prove every product requirement, production configuration, mobile layout, account recovery flow, or live data migration is correct.

## 3. Priority definitions

- **P0 — Release/data safety:** must be resolved before claiming release readiness; includes source/deployment mismatch, destructive data paths, authorization, and missing critical verification.
- **P1 — Core correctness:** foundational hierarchy, records, history, dates, tool behavior, and persistence.
- **P2 — Product completeness and quality:** functional UI coverage, settings, accessibility, responsive behavior, localization, performance.
- **P3 — Cleanup and future capability:** legacy retirement after migration, optional presets, advanced analytics, Awwab.

Priority does not imply the issue is confirmed. Every item below must retain its evidence status until reproduced or verified.

## 4. Findings register

### A. Release, CI, and repository governance

| ID | Priority | Finding | Status / required action |
|---|---|---|---|
| REL-01 | P0 | Latest main CI passes, but latest main deployment is not confirmed. | **Known release gap.** Plan a controlled deploy only after pre-release gates; verify exact deployed revision and smoke it afterward. |
| REL-02 | P0 | Production smoke checks the existing Hosting URL; it is not a deployment or source-to-hosting provenance check. | **Confirmed workflow boundary.** Keep smoke and deployment evidence separate; document how deployed revision is established. |
| REL-03 | P1 | Old open PRs #21, #14, and #8 remain open despite later main work; issue #7 remains open. | **Confirmed repository hygiene debt.** Compare each branch against main, identify unique still-relevant changes, then close/supersede or explicitly retain with rationale. Never merge stale branches as a bundle. |
| REL-04 | P1 | `tasks.md` retains unchecked verification items that overlap with newer passing CI, alongside legitimate unverified items. | **Confirmed documentation drift.** Reconcile task status using evidence; separate automated coverage from manual/live verification. |
| REL-05 | P1 | Historical audit reports describe an earlier state and some findings now marked remediated elsewhere. | **Known documentation ambiguity.** Preserve audit history; add a current disposition index mapping each old FOS finding to fixed, partial, not reproduced, or open. |
| REL-06 | P2 | CI uses Node 24 while production-smoke uses Node 22. | **Confirmed configuration difference; impact unproven.** Decide whether intentional; align supported runtime versions or record rationale. |
| REL-07 | P2 | Lint has historically emitted warnings even when CI passes. | **Evidence gap.** Capture current warning count from CI logs and classify each warning; do not suppress warnings blindly. |
| REL-08 | P2 | Large authentication chunk warning was previously observed. | **Known performance follow-up.** Re-measure current build output before prioritizing safe code splitting. |

### B. Data integrity, hierarchy, and lifecycle

| ID | Priority | Finding | Status / required action |
|---|---|---|---|
| DATA-01 | P0 | Page permanent deletion now detaches references from Nodes, legacy activity, and dedicated Tasks before deleting Page documents. | **Implemented and CI-verified.** Preserve the ordering contract and add deeper integration cases for surviving associations, mixed legacy shapes, and failures across batches. |
| DATA-02 | P0 | Preservation coverage for Nodes, habits, sessions, and history is not as complete as Task preservation coverage. | **Known coverage gap.** Verify every record family and Node subcollection/history before release. Do not assume Page deletion only affects Tasks. |
| DATA-03 | P1 | Page hierarchy and Node hierarchy must remain independent. | **Architecture invariant.** Test Page reparent/reorder against Node parent/path, record associations, and history snapshots. |
| DATA-04 | P1 | Node `parentId` is authoritative and `path` is a derived cache; path repair exists in the design/implementation. | **Implemented foundation; integration risk remains.** Verify missing parent, cycle, archived parent, large subtree, interrupted chunked writes, and repair behavior in emulator-backed tests. |
| DATA-05 | P1 | Page reparenting and Page subtree lifecycle have domain safeguards. | **Implemented foundation.** Expand boundary coverage: nested archived/trashed descendants, invalid roots/parents, sibling order, restore semantics, and idempotency. |
| DATA-06 | P1 | Page association (`pageIds` / legacy `pageId`) and view display scope are separate concepts. | **Implemented for Tasks; broader model incomplete.** Specify behavior for each record type and test multi-view/multi-Page cases without record duplication. |
| DATA-07 | P1 | Records in legacy activity and dedicated Tasks may have different historical field shapes. | **Known compatibility concern.** Test normalizing `pageId`-only records, empty/missing `pageIds`, duplicate associations, and association changes that retain unrelated Page IDs. |
| DATA-08 | P1 | Firestore write batches have size limits and chunked hierarchy/lifecycle operations are not globally atomic. | **Known operational risk.** Document recovery/repair behavior, make retries safe, and test failure after a partial chunk where feasible. |
| DATA-09 | P1 | Page deletion references Node and activity root documents, while Node history/values live in subcollections. | **Potential orphan/lifecycle risk.** Decide whether Node data is intentionally preserved independently or requires an explicit user-approved retention policy; never silently cascade-delete subcollections. |
| DATA-10 | P1 | Trash retention and expiry need clear semantics when descendants have different trash timestamps. | **Partially addressed.** Keep the root/subtree expiry planner tests and add mixed retention windows, invalid timestamps, boundary time, and timezone-independent cases. |
| DATA-11 | P2 | Permanent deletion and bulk repair may be expensive for very large trees or many associated records. | **Scale risk, not measured.** Establish reasonable test sizes and instrumentation before optimizing. |

### C. Architecture and specialist record models

| ID | Priority | Finding | Status / required action |
|---|---|---|---|
| ARCH-01 | P1 | Tool Registry, standalone launcher, Page tool-view placements, global defaults, and per-view overrides are implemented foundations. | **Implemented; full tool-by-tool parity is incomplete.** Create a registry inventory with runtime status and actual record model per tool. |
| ARCH-02 | P1 | New Tasks use a dedicated collection while legacy Task reads remain available from activity. | **Implemented migration foundation.** Verify dry-run, additive copy, deterministic identity, deduplicated reads, transactional mirror, rollback, retries, and unknown metadata preservation. |
| ARCH-03 | P1 | Other specialist records (Habits, Focus sessions, workouts/measurements, goals, timers, etc.) still use generic activity/legacy stores in at least part of the app. | **Known architecture gap.** Do not migrate all tools at once. Inventory each model and migrate one domain at a time with reversible contracts. |
| ARCH-04 | P1 | Legacy Study/Work data and old academic collections require a deliberate import/retirement decision. | **Open decision.** Inspect existing paths and migration UI; no automatic startup migration and no deletion of original collections. |
| ARCH-05 | P1 | The PR #21 branch advertises several substantial features but is based on an old main revision and remains open. | **Stale-branch risk.** Audit unique changes against main; do not merge it without rebasing/reimplementing only verified missing pieces. |
| ARCH-06 | P1 | Tool registry metadata can be mistaken for proof of a working runtime or dedicated record model. | **Governance requirement.** Every registry entry must state actual runtime status, supported contexts, record storage mode, and test evidence honestly. |
| ARCH-07 | P2 | Equivalent filters, layout controls, and associations are not yet established across every tool. | **Known product gap.** Reuse common view contracts only where semantics match; avoid forcing irrelevant Task-specific controls onto other tools. |
| ARCH-08 | P2 | Compatibility layers and legacy UI make the codebase multi-generation. | **Known cleanup debt.** Inventory usage/dependencies before removing or redirecting routes/components. |

### D. Functional correctness and user workflows

| ID | Priority | Finding | Status / required action |
|---|---|---|---|
| FUNC-01 | P1 | Page creation, rename/configuration, visibility, ordering, archive/trash/restore, reparenting, and deletion need end-to-end coverage beyond the happy path. | **Partial verification.** Build a workflow matrix and cover invalid inputs, refresh, re-login, and subtree cases. |
| FUNC-02 | P1 | Tool views should show shared records consistently in standalone and embedded contexts. | **Partial verification.** Verify create/edit/complete/reopen/delete, filters, and persistence across two views and after refresh. |
| FUNC-03 | P1 | All visible controls must have real behavior or a clear unavailable state. | **Audit required.** Inventory buttons, links, toggles, menus, form submission, undo, empty states, and destructive confirmations. |
| FUNC-04 | P1 | Calendar, Timetables, Habits, Pomodoro/Focus, Exercise/Measurements, Goals, and History need a capability-by-capability acceptance review. | **Coverage gap.** Confirm each surface's data source, lifecycle, settings, and cross-feature relationships. |
| FUNC-05 | P1 | Focus session pause/resume/reload behavior and record duplication were historical audit concerns. | **Historical finding; current status must be revalidated.** Reproduce with tests before classifying as still defective. |
| FUNC-06 | P1 | Analytics and Dashboard metrics depend on correctly scoped, bounded, non-duplicated source records. | **Historical finding; partial remediation documented.** Verify formulas, time window, trashed Page exclusion, legacy-source deduplication, and empty states. |
| FUNC-07 | P1 | Onboarding must create visible, meaningful first-run state without inventing personal/institutional data. | **Acceptance gap.** Test new account, returning account, incomplete setup, and recovery from invalid preferences. |
| FUNC-08 | P2 | Settings and Page Builder must protect unsaved edits and give useful validation feedback. | **Some safeguards implemented.** Verify all exit paths, browser refresh/navigation, failed saves, and concurrent snapshots. |
| FUNC-09 | P2 | Legacy Workspace routes/links and old Settings surfaces may remain as compatibility code. | **Cleanup required after route inventory.** Redirect safely; do not remove data-access code merely because a screen is hidden. |

### E. Dates, calendar, preferences, and localization

| ID | Priority | Finding | Status / required action |
|---|---|---|---|
| TIME-01 | P1 | Configured timezone must drive day keys, due dates, recurrence, habit streaks, and daily metrics consistently. | **Historical high-impact audit concern.** Verify current implementation at UTC boundaries and Asia/Kolkata midnight; do not rewrite existing records silently. |
| TIME-02 | P1 | Invalid stored timezone/locale values can break rendering if not normalized. | **Historical crash concern; current state must be reproduced.** Test malformed existing profile data and recovery path. |
| TIME-03 | P1 | Calendar and Timetables need consistent recurrence, first-day-of-week, event filtering, and completion behavior. | **Known verification gap.** Test month boundaries, daylight-saving zones where applicable, Hijri adjustments, and time-format persistence. |
| TIME-04 | P2 | Hijri display may use a tabular fallback and adjustment settings; parity should be explicit. | **Known validation gap.** Document supported calendar method and compare representative dates against references. |
| TIME-05 | P2 | Language/RTL, scale, density, contrast, reduced motion, and target-size settings need full UI coverage. | **Partially implemented per remediation notes.** Verify real effect across all major surfaces and not just saved preference state. |

### F. Security, reliability, and operations

| ID | Priority | Finding | Status / required action |
|---|---|---|---|
| SEC-01 | P0 | Firestore owner-only rules have emulator coverage in recent CI. | **CI-verified.** Keep unauthenticated and cross-owner denial tests as release gates; never weaken user scoping. |
| SEC-02 | P0 | Repository rules and live Firebase rules/deployment configuration are not independently confirmed to match. | **External verification gap.** Before release, inspect deployed rules/configuration through an authorized Firebase workflow and record evidence. |
| SEC-03 | P1 | Authentication core route/login/logout/re-login flows are covered, but account recovery, expired sessions, and auth errors need more coverage. | **Partial coverage.** Add non-destructive tests and clear user-facing recovery states. |
| SEC-04 | P1 | Browser test data must remain disposable and isolated from real user data. | **Required guardrail.** Keep emulator-backed tests as default; any live write test requires a dedicated test account and explicit cleanup. |
| SEC-05 | P1 | Export/backup is implemented, but restore/import integrity is not established by export existence alone. | **Known verification gap.** Verify export completeness, schema/version metadata, secret exclusion, and round-trip restore only in disposable data. |
| SEC-06 | P2 | Error boundaries, listener error handling, retry feedback, and partial-write recovery should be audited across routes. | **Coverage gap.** Make errors observable; avoid silent fallbacks that hide corrupted data. |

### G. UI/UX, accessibility, performance, and product quality

| ID | Priority | Finding | Status / required action |
|---|---|---|---|
| UX-01 | P1 | Core Page and tool workflows need coherent loading, empty, success, validation, and failure states. | **Audit required.** Include no-data, offline, permission denied, and save failure cases. |
| UX-02 | P2 | Mobile layouts and touch targets need real verification at narrow widths, not CSS-only confidence. | **Known verification gap.** Test 320/375/768px and desktop with long labels, nested navigation, forms, grids, and dialogs. |
| UX-03 | P2 | Keyboard navigation, visible focus, skip links, screen-reader names, contrast, and reduced-motion support need broad checks. | **Partial remediation exists.** Verify all interactive surfaces and builder flows. |
| UX-04 | P2 | Large authentication bundle warning was previously observed. | **Optimization candidate.** Re-measure before choosing route-level lazy loading; preserve auth reliability. |
| UX-05 | P2 | Visual language and fixed-area navigation must stay consistent as legacy screens are consolidated. | **Design contract exists.** Review against `design.md`; avoid one-off styles and decorative metrics without purpose. |
| UX-06 | P3 | Page presets and richer dashboard/analytics ideas are optional enhancements. | **Future ideas.** Only consider after core workflows, accessibility, and data contracts are stable. |

## 5. Phased execution plan

The phase sequence is dependency-driven. Do not skip release/data gates to accelerate visible features.

### Phase 0 — Documentation and branch hygiene (this planning phase)
**Goal:** One reliable plan and one consistent status record.  
**Deliverables:** This audit, execution checklist, reconciled roadmap/status/verification/memory/changelog, inventory of stale PRs and historical findings.  
**Exit criteria:** Documentation PR reviewed; no source code changed; every finding has priority, status, and a phase; stale PRs are classified.  
**Status:** In progress in this documentation-only branch.

### Phase 1 — Establish truth and release baseline
**Goal:** Know exactly what source is running and what the current app actually does.  
**Work:** Verify main CI evidence; classify lint warnings; inspect production deployment provenance and deployed Firebase rules; create current route/tool/runtime inventory; execute authorized production smoke only after deployment provenance is understood.  
**Exit criteria:** Exact source SHA and Hosting release relationship recorded; current production/rules state recorded; no unresolved P0 uncertainty hidden as complete.  
**Guardrail:** Do not deploy merely to make the SHA match; review user-data and release risks first.

### Phase 2 — Data-integrity and lifecycle contracts
**Goal:** Protect user records before adding architecture or UI complexity.  
**Work:** Expand Page deletion preservation matrix for Nodes, activity, Tasks, Habits, Focus sessions, reminders, and Node history/values; verify surviving Page associations; test mixed trash retention; cover Page and Node hierarchy independence, cycle/missing-parent rejection, path repair, large/chunked writes, partial failures, and retries.  
**Exit criteria:** Domain and emulator tests cover the critical preservation matrix; recovery behavior is documented; destructive paths fail safely.

### Phase 3 — Shared records, view scopes, and Tool Registry truth
**Goal:** Ensure every view is a projection of a single underlying record, not a hidden duplicate.  
**Work:** Inventory each registered tool's actual storage/runtime status; define record association versus view display scope; verify multi-Page views and standalone tools; verify Task migration preview/copy/idempotency/deduplication/mirroring/rollback; decide migration contract for each remaining specialist tool separately.  
**Exit criteria:** Tool matrix matches implementation; Task migration is tested on disposable data; no legacy collection is retired without a verified replacement and rollback.

### Phase 4 — Core workflow completion and functional regression
**Goal:** Make every promised user-facing workflow reliable.  
**Work:** Page lifecycle and configuration, Node CRUD/hierarchy, Tools launcher and placements, shared Task create/edit/complete/reopen, Calendar, Timetables, Habits, Focus/Pomodoro, Exercise/Measurements, Goals/Metrics, History, export/backup, onboarding and Settings. Audit all visible controls.  
**Exit criteria:** Each surface has a workflow checklist with create/read/update/delete or lifecycle semantics, persistence-after-refresh, error handling, and evidence.

### Phase 5 — Time correctness, preferences, and data resilience
**Goal:** Eliminate cross-timezone/date bugs and recover cleanly from malformed or old profile data.  
**Work:** Test timezone normalization, local day keys, recurrence, streaks, date boundaries, calendar settings, Hijri adjustment/fallback, locale/language/RTL, and preference migration/normalization.  
**Exit criteria:** Boundary tests pass in representative time zones; invalid legacy preferences do not crash the app; existing records are not silently rewritten.

### Phase 6 — UX, accessibility, responsive design, and performance
**Goal:** Bring the product to a consistent quality bar.  
**Work:** Mobile/narrow-width verification; keyboard-only and screen-reader pass; focus/contrast/target-size/reduced-motion checks; loading/empty/error states; route/legacy navigation cleanup; bundle measurement and safe splitting if justified.  
**Exit criteria:** Findings have reproducible steps and resolutions; core flows pass desktop/mobile/accessibility checks; no unreviewed visual regressions.

### Phase 7 — Migration, legacy retirement, and architecture cleanup
**Goal:** Remove duplicated/obsolete implementation only after safe replacements exist.  
**Work:** Choose per-tool migration plans; use additive, idempotent, user-triggered migrations with backup, dry run, verification, rollback, and retirement window. Audit legacy Workspace, old Settings, academic collections, and duplicated specialist adapters.  
**Exit criteria:** Every migrated tool has counts/identity/history/reference verification and a rollback path; no destructive auto-migration; no data collection is removed solely to hide a feature.

### Phase 8 — Release candidate and production sign-off
**Goal:** Release with evidence, not assumptions.  
**Work:** Full CI (lint, unit/domain, build, Firestore rules, emulator E2E); review diff and warnings; deploy approved main SHA; verify deployment identity; production smoke; authenticated manual spot checks; backup/rollback readiness; update verification and changelog.  
**Exit criteria:** The deployed SHA is recorded, all required checks are green, P0/P1 release blockers are closed or explicitly accepted, and production evidence is current.

### Phase 9 — Optional product expansion
**Goal:** Improve utility after foundation stability.  
**Candidates:** More tool-specific view configuration, Page presets, richer analytics, improved export/restore UX, and later Awwab interfaces.  
**Exit criteria:** Each idea has a user problem, acceptance criteria, architecture fit, and cost/benefit. Awwab remains deferred until stable, permission-checked application/domain APIs exist.

## 6. Definition of done for every phase

A phase is not complete because code was written or a PR was merged. Its completion record must include:
1. Scope and acceptance criteria.
2. Evidence from tests or inspection appropriate to the risk.
3. Data/security review where applicable.
4. Regression results and any skipped checks.
5. Documentation updates (`tasks.md`, `PROJECT_STATUS.md`, `CURRENT_VERIFICATION.md`, `CHANGELOG.md`, and architecture/PRD/design/decisions as affected).
6. Explicit residual risks and rollback/recovery plan.
7. Correct status label: Planned, Implemented, Verified, Blocked, or Deferred.

## 7. Immediate next actions after this plan

1. Merge the documentation-only plan after review.
2. Reconcile stale PRs #21, #14, and #8 and issue #7; do not merge stale branches without diff comparison.
3. Establish the release/deployment baseline (Phase 1).
4. Complete the cross-record Page deletion and hierarchy preservation matrix (Phase 2).
5. Then proceed to tool/record-model and functional completeness work.

## 8. Product ideas — deliberately not current commitments

- Per-tool capability/record-model status dashboard for maintainers.
- User-facing data health/export/restore assistant.
- Safer recovery preview for bulk Page/Node changes.
- More flexible per-view filters where each tool's domain supports them.
- Optional Page presets with transparent contents and no hidden records.
- Awwab as a permission-checked assistant layer after core APIs stabilize.

Ideas do not enter the implementation queue until their user value and dependencies are agreed in product documentation.


## Execution evidence update — 2026-10-18

This section supersedes stale status snapshots above where newer evidence exists; it does not rewrite the original audit baseline.

- **Current `main`:** `07935d4adb56f8ce7e702a40c4d5aec319c7aec8` (Phase 2 PR #39 merged).
- **CI visibility issue:** issue [#7](https://github.com/mdanasaaq-design/FocusOS/issues/7) is closed. Main commit `6c52a22a99fe2068c55829c6ec22def601b47b05` passed [CI run 39115894162](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39115894162); the existing-site Cloud Smoke run [39115894170](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39115894170) also passed. These runs do not prove that commit is deployed.
- **Phase 2 progress:** PR [#39](https://github.com/mdanasaaq-design/FocusOS/pull/39) merged with all-known-record-family Page-reference cleanup and emulator-backed preservation coverage. PR [#40](https://github.com/mdanasaaq-design/FocusOS/pull/40) currently has successful `verify` and `e2e` jobs on head `03490cb6cadcf5b0aae8363b01a12dccbfec78d2`; actual Firestore chunk-failure/retry behavior is still unverified.
- **Open PR reconciliation:** PR [#21](https://github.com/mdanasaaq-design/FocusOS/pull/21) overlaps with work already merged (Page associations/lifecycle, Node path repair, task view/migration foundations), but unique task migration/data-model/E2E changes must be compared before closing. PR [#8](https://github.com/mdanasaaq-design/FocusOS/pull/8) contains a unique `PRODUCT_DIRECTION.md` and product/UI changes; keep it open pending comparison against current main. PR #14 is not in the current open-PR listing. Do not close or merge stale branches solely due to age.
- **Phase 1 remains blocked/incomplete:** the exact deployed source SHA and deployed Firestore rules have not been verified. No production deployment was performed as part of this pass.
