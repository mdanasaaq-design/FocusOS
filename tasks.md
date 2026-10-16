# FocusOS — Tasks and Roadmap

## 1. How to Use This Roadmap

This file tracks implementation work and its completion status. It is not the source of product requirements, architecture definitions, or release evidence.

- `prd.md` defines the intended product behavior.
- `architecture.md` defines the target technical design and data-integrity rules.
- `tasks.md` tracks implementation and documentation work.
- `CURRENT_VERIFICATION.md` records observed test results, production checks, and release risks.

A checked task means the scoped work described by that task was completed; it does not imply that every related user workflow is production-verified. Keep end-to-end and release evidence in `CURRENT_VERIFICATION.md`.

## 2. Priority Roadmap

### P0 — Establish reliable verification

- [ ] Resolve the current PR #33 CI failure: reconcile the Page-deletion lifecycle contract and the stale assertion in `tests/core.test.js`; verify record preservation before changing expectations.
- [ ] Keep `AGENTS.md`, `docs/DECISIONS.md`, and the source-of-truth documents aligned as project rules and durable decisions evolve.
- [ ] Reconcile `design.md` navigation with the agreed fixed areas: Dashboard, Pages, Calendar, and Settings; keep Tools as a separate launcher surface.
- [ ] Confirm a successful run of `.github/workflows/production-smoke.yml`.
- [ ] Run `npm test`, `npm run build`, and lint on the current branch; record actual results.
- [ ] Verify Firebase Authentication, login/logout, protected routes, and re-login.
- [ ] Verify Firestore owner-only access with rules tests or a controlled emulator environment.
- [ ] Verify the current deployed production build against the intended `main` commit.
- [ ] Keep `CURRENT_VERIFICATION.md` aligned with observed results; do not infer success from configuration alone.

### P1 — Protect Page, Node, and record integrity

- [ ] Add or verify pure tests for Page hierarchy operations, including recursive nesting, reorder, reparent, and cycle rejection.
- [ ] Add or verify Node hierarchy tests, including parent validation, cycle rejection, and descendant `path` updates.
- [ ] Test that Page hierarchy and Node hierarchy remain separate.
- [ ] Test that moving a Page preserves record associations and Node relationships.
- [ ] Fully verify deletion preservation across all record types. Task preservation is covered by emulator-backed E2E; Node, habit, session, and history preservation still need dedicated coverage.
- [x] Support multiple Page associations for Tasks records while preserving the legacy `pageId` field.
- [ ] Test shared records across standalone tools and multiple Page views.
- [ ] Test that per-view filters/layout do not mutate records or affect other views.
- [ ] Document the current Firestore data model, ownership boundaries, and retention behavior.
- [ ] Define safe, reversible migration and recovery practices before changing persisted data.

### P2 — Align the application with the target architecture

- [ ] Inventory the current Page, Node, capability, and specialist-tool implementations against `architecture.md`.
- [x] Define the first Tool Registry contract: stable tool key, supported views/actions, record model, and configuration schemas.
- [x] Define global tool configuration defaults and per-view configuration overrides.
- [x] Define a Page tool-view placement contract that references a tool and its configuration without duplicating records.
- [ ] Keep specialized operational records in appropriate tool data models instead of forcing all records into Nodes.
- [x] Implement the registry/runtime incrementally, starting with a small tool and preserving existing behavior.
- [x] Provide a tool discovery/launcher interface separate from Pages workspace management.
- [x] Support opening a tool independently without requiring a permanent user-created Page.
- [x] Support adding configured tool views to Pages, including multiple views over the same underlying records.
- [ ] Preserve compatibility with existing Page configuration and Node data while the target model is introduced.

### P3 — Migrate legacy specialist surfaces safely

- [ ] Inventory data, routes, and behavior for Tasks, Timetables, Study/Work, Pomodoro, Exercise, and Habits.
- [ ] Define each tool's specialized record contract and standalone/Page-embedded views.
- [x] Document capability contracts for Focus Sessions, Time Tracking, Tasks, Habits, Routines, Goals/Metrics, Workout, Measurements, Activity/History, and Analytics.
- [x] Document intended mappings from legacy Pomodoro, Habits, Exercise/Weight, and Tasks data to their corresponding tool domains.
- [ ] Decide and document the migration path for legacy Study/Work data.
- [ ] Verify the existing migration/import UI against representative disposable data.
- [ ] Test that migration preserves stable record IDs, history, ownership, and references wherever possible.
- [ ] Do not retire or redirect a legacy route until replacement behavior and data integrity are verified.
- [ ] Verify Timetables' relationship to Calendar and the target tool model before changing its current behavior.
- [ ] Verify that specialist tools remain optional and do not impose fixed life categories.

## 3. Pages and Workspace Management

- [x] Implement the current Page data model and Page management foundations.
- [x] Add Page visibility and presentation configuration.
- [x] Add Trash controls to restore or permanently delete a trashed Page subtree while preserving underlying records.
- [ ] Verify Page creation, rename/edit, ordering, archive/trash, restore, and deletion.
- [ ] Verify that any Page can contain child Pages recursively, subject to data-integrity constraints.
- [ ] Verify moving a Page moves its descendant Page hierarchy without silently reassigning records.
- [ ] Verify Pages can display/link to Nodes and records without owning or duplicating them.
- [ ] Keep workspace management in the fixed Pages area and tool discovery/launch separate.
- [ ] Remove or safely redirect stale legacy Workspace routes and links.
- [ ] Ensure fixed system areas remain Dashboard, Pages, Calendar, and Settings; specialist tools must not become fixed system areas merely because they have dedicated interfaces.

## 4. Nodes and Domain Records

- [x] Implement Node descriptions, icons, colors, and timestamps.
- [x] Implement custom fields.
- [x] Add a Node detail view.
- [x] Add child Node management.
- [x] Add persistent Node activity/history.
- [ ] Verify Node creation, editing, ordering, reparenting, archive/restore, and persistence.
- [ ] Verify Node `parentId` remains the source of truth and `path` remains a derived ancestor list.
- [ ] Validate ownership, parent existence, cycles, and descendant paths during Node moves.
- [ ] Document which concepts belong in Nodes versus specialized tool records.
- [ ] Verify that record-to-Node relationships are explicit and do not imply Page hierarchy or navigation visibility.
- [ ] Verify record creation from a Page associates the record with that Page by default when supported, while allowing general/unassociated records.
- [ ] Verify a record can be displayed in a Page without being associated with it where the product supports that distinction.

## 5. Tool Registry and Configurable Views

- [ ] Finalize the built-in Tool Registry contract and stable tool identifiers.
- [x] Define validated schemas for global tool settings and per-view settings.
- [x] Define the tool launcher and independent tool runtime.
- [x] Define Page placement identity and persistence for embedded tool views.
- [x] Implement initial Tasks view sorting, grouping, compact/list layout, and visible-field controls in Page and standalone views.
- [x] Add Task status and priority filters, including visibility for completed Tasks.
- [x] Support Task title/due-date/priority editing and reopening completed Tasks.
- [ ] Ensure a tool view can specify filters, sorting, grouping, visible fields, and layout.
- [ ] Ensure view settings override global defaults without changing other views.
- [x] Ensure multiple views read and update the same underlying records.
- [ ] Ensure tool-specific records remain owner-scoped and validate references at persistence boundaries.
- [ ] Define a safe extension contract for future integrations; do not support arbitrary executable user code.
- [x] Document the intended contracts for the initial specialist capability families.
- [ ] Do not treat documented contracts as proof that the registry/runtime is implemented or verified.

## 6. Dashboard

- [x] Add dashboard configuration model.
- [x] Add Dashboard Builder in Settings.
- [x] Support widget enable/disable and layout controls.
- [x] Keep homepage dashboard rendering separate from editing.
- [x] Add persistent dashboard layouts.
- [x] Add widget configuration panels.
- [x] Add multiple dashboard layouts.
- [x] Add widget duplication and collapse.
- [x] Add configurable dashboard visibility rules.
- [x] Add Page-bound capability dashboard widgets and presentation configuration.
- [ ] Verify Dashboard Builder actions and saved layouts persist after refresh and re-login.
- [ ] Verify dashboard data sources reference the underlying tool, Node, or record scope without duplicating source records.
- [ ] Review existing dashboard bindings as the Tool Registry and view-placement model are introduced.

## 7. Calendar, Timetables, and Regional Settings

- [ ] Separate calendar configuration from calendar rendering.
- [ ] Verify primary/secondary calendar systems and supported regional settings.
- [x] Add configurable clock settings.
- [x] Add configurable date and calendar settings.
- [x] Add language and region setup.
- [ ] Verify configurable time zone, date/time format, and first day of week end-to-end.
- [ ] Verify Node-linked events and event visibility filters.
- [x] Support event visibility filters.
- [ ] Verify Timetable creation, conflict detection, completion persistence, and compatibility with Calendar.
- [ ] Verify recurrence and date-boundary behavior across configured time zones and calendar systems.

## 8. Onboarding, Preferences, Accessibility, and Localization

- [x] Add configurable Islamic greeting prefix.
- [x] Add configurable time-based greetings.
- [x] Add display-name toggle.
- [x] Add theme and contrast controls.
- [x] Add reduced motion setting.
- [ ] Build guided first-login onboarding.
- [ ] Add and verify onboarding completion state.
- [ ] Add application language preference and verify language changes across the interface.
- [ ] Add font/UI scale where supported.
- [ ] Audit keyboard navigation and visible focus indicators.
- [ ] Audit screen-reader labels and accessible interaction targets.
- [ ] Verify responsive behavior across mobile and desktop layouts.
- [ ] Verify greeting, clock, and preference persistence against the current implementation.

## 9. Security, Reliability, and Test Automation

- [ ] Verify Firebase Authentication and protected routes.
- [ ] Verify Firestore owner-only security rules.
- [ ] Add or verify domain-level validation tests.
- [ ] Add Firestore Emulator/rules integration tests.
- [ ] Add authenticated Playwright tests using a dedicated test account and GitHub Actions secrets.
- [ ] Cover login/logout, protected routes, Page lifecycle, tool views, record creation, and persistence after refresh/re-login.
- [x] Add a GitHub Actions workflow for cloud-based production smoke testing.
- [x] Add an initial Playwright homepage smoke test for HTTP success, visible content, and uncaught page errors.
- [ ] Confirm the first successful run of `.github/workflows/production-smoke.yml`.
- [ ] Run lint and review existing warnings.
- [ ] Review and reduce the oversized authentication bundle through safe code splitting.
- [ ] Perform mobile/responsive and accessibility verification.
- [ ] Perform production smoke testing against the deployed commit and record results in `CURRENT_VERIFICATION.md`.

Safety constraints:
- Use a dedicated test account and disposable test data for browser tests that write to Firestore.
- Keep credentials in GitHub Actions secrets; never commit them to Markdown, source files, logs, or screenshots.
- Do not run destructive test flows against real user data.
- A successful build or homepage smoke test alone is not release sign-off.

## 10. Future Awwab Layer

Awwab work starts only after the FocusOS foundation and its data-integrity contracts are stable and explicitly approved.

- [ ] Define stable FocusOS application/domain APIs.
- [ ] Define read-only assistant context access.
- [ ] Define permission boundaries for automation.
- [ ] Design memory integration.
- [ ] Design planning integration.
- [ ] Design voice integration.

Awwab must use validated application interfaces and must not bypass ownership, permission, or domain rules.

## 11. Completion and Status Rules

- Mark a task complete only when its stated scope is done.
- For tasks that involve behavior, include or identify a verification method.
- Keep actual command results, CI runs, production observations, and known release gaps in `CURRENT_VERIFICATION.md`.
- If architecture changes, update `architecture.md` first and then reconcile affected tasks.
- Prefer small, reviewable changes and additive migrations.
- Preserve user data and meaningful history; do not silently delete or reinterpret records.
