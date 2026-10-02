# FocusOS — Tasks and Roadmap

## 1. Task Management Rules

- Tasks must be derived from the product and architecture documents.
- Each task should have a clear scope and verification method.
- Avoid implementing future capabilities before the foundation is stable.
- Mark tasks complete only after code review, build verification, and relevant tests.

## 2. Foundation and Safety

- [x] Review current repository against `prd.md` and `architecture.md`.
- [x] Identify existing legacy features and their migration status.
- [ ] Verify Firebase Authentication and protected routes.
- [ ] Verify Firestore owner-only security rules.
- [ ] Add or verify domain-level validation tests.
- [ ] Document the current Firestore data model.
- [ ] Add a safe migration strategy for evolving records.

## 3. Universal Node Foundation

- [x] Finalize the Page/Node domain contract.
- [ ] Validate unlimited parent-child relationships.
- [ ] Support create, rename, archive, restore, move, and reorder.
- [x] Support Node descriptions, icons, colors, and timestamps.
- [x] Support custom fields.
- [x] Add Node detail view.
- [x] Add child Node management.
- [x] Add persistent Node activity/history.
- [ ] Verify Page operations with pure tests.

- [x] Add Page visibility and presentation configuration.

## 4. Capability Foundation

- [ ] Finalize built-in capability registry.
- [ ] Define capability binding schema.
- [x] Attach and detach capabilities from Pages.
- [x] Enable and disable capability bindings.
- [x] Add capability configuration validation.
- [ ] Define safe user-created capability schema.
- [ ] Avoid arbitrary executable user code.

## 5. Dashboard

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

## 6. Calendar and Regional Settings

- [ ] Separate calendar configuration from calendar rendering.
- [ ] Support primary and secondary calendar systems.
- [ ] Support configurable time zone.
- [ ] Support date and time format preferences.
- [ ] Support first day of week.
- [ ] Support Node-linked events.
- [x] Support event visibility filters.

## 7. Onboarding and Preferences

- [x] Add configurable Islamic greeting prefix.
- [x] Add configurable time-based greetings.
- [x] Add display-name toggle.
- [ ] Build guided first-login onboarding.
- [x] Add configurable clock settings.
- [x] Add configurable date and calendar settings.
- [x] Add language and region setup.
- [ ] Add onboarding completion state.

## 8. Accessibility and Localization

- [ ] Add application language preference.
- [x] Add theme and contrast controls.
- [ ] Add font/UI scale.
- [x] Add reduced motion setting.
- [ ] Audit keyboard navigation.
- [ ] Audit focus indicators.
- [ ] Audit screen-reader labels.
- [ ] Verify responsive behavior.

## 9. Verification and Deployment

- [x] Run `npm run build` after the current Node detail upgrade.
- [ ] Run all domain verification scripts.
- [ ] Verify login and logout.
- [ ] Verify protected routes.
- [ ] Verify greeting settings.
- [ ] Verify dashboard builder persistence.
- [ ] Verify Firestore rules.
- [x] Deploy Firebase Hosting after the Node detail upgrade.
- [x] Perform production smoke test.
- [x] Record deployment result.

## 10. Oct 1 Release Stabilization\n\n- [x] Reframe Workspace as the Page Builder.\n- [x] Make user-created Pages independently configurable from Settings.\n- [x] Make left-sidebar Page visibility explicit and opt-in.\n- [x] Keep Dashboard, Calendar and Settings as the fixed system areas.\n- [x] Add direct Page -> Settings configuration flow.\n- [ ] Run `npm run lint`.\n- [ ] Run `npm run build`.\n- [ ] Test create root Page.\n- [ ] Test create child Page.\n- [ ] Test move/rename/archive Page.\n- [ ] Test Page field persistence.\n- [ ] Test Page capability configuration.\n- [ ] Test sidebar visibility toggle and ordering.\n- [ ] Test Dashboard Page presentation.\n- [ ] Test login/logout and protected routes.\n- [ ] Deploy Firebase Hosting and run production smoke test.\n\n
## 12. Specialist-app benchmark integration

Benchmark reference: APP_BENCHMARK.md (2026-10-02).

### Capability contracts

- [x] Define Focus Sessions capability: configurable intervals, Page/task association/context, completion history, and focus analytics.
- [x] Define Time Tracking capability: running timer, manual entry, activity association, and durable reports.
- [x] Define Tasks capability: priorities, due dates, recurrence, subtasks, estimates, and durable completion records.
- [x] Define Habits capability: cadence, adherence history, streaks, recovery-safe missed days, and trend views.
- [x] Define Routines capability: ordered steps, completion history, and repeatable records.
- [x] Define Goals/Metrics capability: numeric targets, periods, progress logging, and derived progress.
- [x] Define Workout capability: sets/reps/load/duration records and history.
- [x] Define Measurements capability: dated values, units, and history.
- [x] Define shared Activity/History contracts so capabilities produce durable records without duplicating analytics data.
- [x] Define Analytics capability for 7/30-day summaries, trends, and Page-level aggregation.

### Legacy migration

- [x] Map existing Pomodoro records to Focus Sessions without data loss.
- [x] Map existing Habits records to the new Habits capability without losing historical logs.
- [x] Map existing Exercise/Weight records to Workout and Measurements capabilities.
- [x] Map existing Tasks data to Page-bound Tasks; Timetables remain a fixed Calendar-adjacent legacy surface until their Page semantics are defined.
- [ ] Decide and document the migration path for legacy Study/Work data.
- [ ] Do not retire legacy routes until replacement runtimes and migration verification pass.

### Product verification

- [ ] Test one real composition end-to-end: Page → Task → Focus Session → history → dashboard widget.
- [ ] Test one tracking composition: Page → Workout/Measurement → goal → trend history.
- [ ] Verify all specialist capabilities remain optional and do not introduce fixed life categories.


## 12.1 2026-10-02 Capability implementation status

Implemented in the Page runtime:

- [x] Shared Page-bound Activity/History Firestore data layer.
- [x] Focus Sessions runtime with configurable focus/break intervals and durable completion records.
- [x] Tasks runtime with priority, due date, completion state, and persistent records.
- [x] Time Tracking runtime with running timer and saved duration entries.
- [x] Habits runtime with daily check-ins and retained history.
- [x] Routines runtime with repeatable routine records and completion history.
- [x] Workout runtime with exercise, sets, reps, load, and duration records.
- [x] Measurements runtime with dated values and units.
- [x] Goals runtime with measurable targets.
- [x] Analytics runtime with Page-level daily activity summaries.
- [x] Explicit Page sidebar visibility is now enforced by the sidebar.

Verification status:

- [ ] Run npm run lint on the updated branch.
- [ ] Run npm run build on the updated branch.
- [ ] Exercise the new capability runtimes against the live Firebase project.
- [ ] Verify Firestore activity records and owner-only rules in production.
- [x] Add explicit legacy-data migration UI before retiring specialist routes.

## 13. Future Awwab Layer

- [ ] Define stable FocusOS application APIs.
- [ ] Define read-only assistant context access.
- [ ] Define permission boundaries for automation.
- [ ] Design memory integration.
- [ ] Design planning integration.
- [ ] Design voice integration.

Awwab implementation must begin only after the FocusOS foundation is stable and explicitly approved.
