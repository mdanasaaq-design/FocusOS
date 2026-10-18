# FocusOS — Project Memory

## Current execution state (2026-10-18)

- Phase 0 plan merged; Phase 1 verification baseline recorded. Production deployed SHA and deployed Firestore rules remain unverified.
- Phase 2A Page-reference preservation merged as `07935d4`; final PR CI passed, including emulator-backed preservation of known record families and Node history/value subcollections.
- Phase 2B Node path repair/chunked reparenting is active in PR #40; do not mark Phase 2 complete until final CI and recovery verification pass.
- Stale PR #14 and issue #7 were closed as superseded/resolved. PR #21 and #8 remain under review; do not merge their stale branches without selectively reconciling unique changes.

## Project Identity

- Project: FocusOS
- Repository: `mdanasaaq-design/FocusOS`
- Firebase project: `focusos-7cd08`
- Primary purpose: configurable single-user personal operating system
- Future assistant layer: Awwab, not part of the current foundation

## Ownership and Roles

- User: owner and final approver
- GPT: product manager, architect, planner, and reviewer
- Claude: implementation engineer

## Locked Product Decisions

1. FocusOS must adapt to the user.
2. The fixed system areas are Dashboard, Pages, Calendar, and Settings; Tools are discovered/launched through a separate tool-launching surface.
3. User-created workspaces use the Page model; general-purpose organizational entities use the Node model. Page and Node hierarchies are distinct.
4. Nodes support unlimited parent-child nesting.
5. Capabilities attach to Nodes.
6. Users should eventually be able to create their own capabilities.
7. Dashboard content and layout are completely customizable.
8. Calendar and regional settings are configurable.
9. Accessibility is a first-class system concern.
10. Awwab must be built later on top of FocusOS rather than becoming its foundation.

## Greeting Decision

The default greeting uses a configurable Islamic prefix and a separate time-based greeting. The default prefix is `Assalamualaikum warahmatullahi wabarakatuhu`. The prefix and time greeting are rendered as separate header lines.

The prefix, time messages, custom greeting mode, and display-name inclusion are configurable.

## Page Model Decision — 2026-09-30

The previous Workspace implementation was too close to a generic Node/folder manager. The intended product model is now explicit:

- Pages are user-facing workspaces; Nodes are a distinct general-purpose organizational model. Do not conflate Page and Node hierarchies.
- The **Pages** area is the user-facing Page Builder.
- Parent-child hierarchy is structural only.
- Legacy Workspace routes/components are not an intended product surface and must be removed or redirected safely.
- Settings controls how a Page works: fields, capabilities, capability configuration, visibility and presentation.
- A Page may be allowed in the left sidebar, but sidebar visibility is opt-in.
- A Page may be allowed on the Dashboard independently.
- Page Detail is the runtime surface for using the configured Page.
- Dashboard, Pages, Calendar and Settings are the fixed system areas; Tools use a separate launcher surface.

This separation is the basis for the Oct 1 usable FocusOS release.

## Technical Context

- React
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## Existing Implementation Notes

- Login is working.
- Firestore rules have been deployed successfully.
- Production build succeeds, with a large JavaScript chunk warning that should be addressed later.
- Dashboard Builder was added to Settings and merged through PR #1.
- Homepage Dashboard rendering is separate from the editing builder.
- Existing legacy functionality must be migrated carefully rather than removed immediately.

## Important Constraints

- Preserve real user history.
- Do not commit `.env` files.
- Avoid destructive migrations.
- Verify builds and relevant tests before deployment.
- Keep architecture and implementation documents synchronized.

## Documentation Contract

The following files are the project source of truth:

- `prd.md`
- `architecture.md`
- `rules.md`
- `design.md`
- `tasks.md`
- `memory.md`

When a major product or architecture decision changes, update the relevant document in the same work cycle.
\n## Current Builder State — 2026-09-30\n\nThe Universal Node Builder now persists node identity, custom fields, capability bindings, capability configuration, visibility/presentation settings, and Node-bound Dashboard widget instances. Dashboard widget instances support saved view and title overrides. Pages remain hierarchy-focused; Settings remains the configuration surface. Legacy Workspace code is cleanup debt, not a product requirement.\n
## Page Architecture Decision — reconciled 2026-10-16

- Page hierarchy and Node hierarchy are distinct and must not be conflated.
- Pages organize user-facing workspaces; Nodes are general-purpose organizational entities.
- The Pages area is the Page Builder. New Pages can start empty and expose only fields, capabilities, child content, navigation visibility, and presentation that the user configures.
- Settings is the configuration surface where the relevant configuration is supported; Page Detail is the runtime surface.
- Page and Node moves/deletions must preserve unrelated relationships, underlying records, stable IDs, and history.
- The fixed system areas are Dashboard, Pages, Calendar, and Settings. Tools are discovered and launched separately, and may run standalone or as Page views.
- `architecture.md` is authoritative for the current technical contract; reconcile this memory when that contract changes.



## Current Audit and Phased Execution Plan — 2026-10-18

- Audited main baseline: `2818f03c45384e9fe2e97e92e4a4c265098470d3`; its GitHub CI run `38890113167` passed.
- The audited main revision is not confirmed deployed to Firebase Hosting; a production smoke run does not deploy source code.
- PR #33, #34, and #35 are merged. Older open PRs #21, #14, #8 and issue #7 require explicit stale-work triage; do not merge old branches without comparing their unique changes to current main.
- Current consolidated plan: `docs/PROJECT_AUDIT_AND_PHASE_PLAN.md`; phase gates: `docs/PHASE_EXECUTION_CHECKLIST.md`.
- Sequence: documentation/branch hygiene → deployment and rules baseline → data integrity/lifecycle → tool/record models → functional workflows → timezone/preferences → accessibility/responsive/performance → reversible migration/legacy retirement → release sign-off → optional expansion.
- Current high-risk gaps: latest deployment provenance; broader Page-deletion preservation for Nodes/history/values and non-Task records; Node/Page hierarchy and partial-write recovery edge cases; other specialist tools still using legacy activity storage; migration verification; manual mobile/accessibility/timezone checks; deployed Firestore rules parity.
- This audit was documentation-only: no application source edits, build, or deployment.


## Execution update — 2026-10-18
- Current main after PR #40: `91801201e9b48e6d4fff128b6c619b3d34cf9740`.
- Issue #7 is closed; push-triggered CI and existing-site Cloud Smoke are observable, but neither establishes deployed source SHA or deployed Firestore rules.
- PR #39/#40 merged after successful CI; real Firestore partial-write/retry behavior remains a Phase 2 gate.
- Keep PR #21/#8 open until unique changes are compared against current main; PR #14 is not currently listed open.
