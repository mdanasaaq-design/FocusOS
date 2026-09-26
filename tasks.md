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

- [ ] Finalize the Node domain contract.
- [ ] Validate unlimited parent-child relationships.
- [ ] Support create, rename, archive, restore, move, and reorder.
- [x] Support Node descriptions, icons, colors, and timestamps.
- [ ] Support custom fields.
- [ ] Add Node detail view.
- [ ] Add child Node management.
- [ ] Add activity/history persistence.
- [ ] Verify Node operations with pure tests.

## 4. Capability Foundation

- [ ] Finalize built-in capability registry.
- [ ] Define capability binding schema.
- [ ] Attach and detach capabilities from Nodes.
- [ ] Enable and disable capability bindings.
- [ ] Add capability configuration validation.
- [ ] Define safe user-created capability schema.
- [ ] Avoid arbitrary executable user code.

## 5. Dashboard

- [x] Add dashboard configuration model.
- [x] Add Dashboard Builder in Settings.
- [x] Support widget enable/disable and layout controls.
- [x] Keep homepage dashboard rendering separate from editing.
- [x] Add persistent dashboard layouts.
- [ ] Add widget configuration panels.
- [ ] Add multiple dashboard layouts.
- [ ] Add widget duplication and collapse.
- [ ] Add configurable dashboard visibility rules.
- [ ] Migrate the existing dashboard to the universal capability model.

## 6. Calendar and Regional Settings

- [ ] Separate calendar configuration from calendar rendering.
- [ ] Support primary and secondary calendar systems.
- [ ] Support configurable time zone.
- [ ] Support date and time format preferences.
- [ ] Support first day of week.
- [ ] Support Node-linked events.
- [ ] Support event visibility filters.

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

- [ ] Run `npm run build`.
- [ ] Run all domain verification scripts.
- [ ] Verify login and logout.
- [ ] Verify protected routes.
- [ ] Verify greeting settings.
- [ ] Verify dashboard builder persistence.
- [ ] Verify Firestore rules.
- [ ] Deploy Firebase Hosting.
- [ ] Perform production smoke test.
- [ ] Record deployment result.

## 10. Future Awwab Layer

- [ ] Define stable FocusOS application APIs.
- [ ] Define read-only assistant context access.
- [ ] Define permission boundaries for automation.
- [ ] Design memory integration.
- [ ] Design planning integration.
- [ ] Design voice integration.

Awwab implementation must begin only after the FocusOS foundation is stable and explicitly approved.
