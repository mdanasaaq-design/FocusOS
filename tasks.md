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

## 10. Oct 1 Release Stabilization\n\n- [x] Reframe Workspace as the Page Builder.\n- [x] Make user-created Pages independently configurable from Settings.\n- [x] Make left-sidebar Page visibility explicit and opt-in.\n- [x] Keep Dashboard, Calendar and Settings as the fixed system areas.\n- [x] Add direct Page -> Settings configuration flow.\n- [ ] Run `npm run lint`.\n- [ ] Run `npm run build`.\n- [ ] Test create root Page.\n- [ ] Test create child Page.\n- [ ] Test move/rename/archive Page.\n- [ ] Test Page field persistence.\n- [ ] Test Page capability configuration.\n- [ ] Test sidebar visibility toggle and ordering.\n- [ ] Test Dashboard Page presentation.\n- [ ] Test login/logout and protected routes.\n- [ ] Deploy Firebase Hosting and run production smoke test.\n\n## 11. Future Awwab Layer

- [ ] Define stable FocusOS application APIs.
- [ ] Define read-only assistant context access.
- [ ] Define permission boundaries for automation.
- [ ] Design memory integration.
- [ ] Design planning integration.
- [ ] Design voice integration.

Awwab implementation must begin only after the FocusOS foundation is stable and explicitly approved.
