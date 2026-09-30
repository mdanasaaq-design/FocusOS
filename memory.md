# FocusOS — Project Memory

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
2. The only fixed system areas are Dashboard, Calendar, and Settings.
3. Everything the user creates begins as a Node.
4. Nodes support unlimited parent-child nesting.
5. Capabilities attach to Nodes.
6. Users should eventually be able to create their own capabilities.
7. Dashboard content and layout are completely customizable.
8. Calendar and regional settings are configurable.
9. Accessibility is a first-class system concern.
10. Awwab must be built later on top of FocusOS rather than becoming its foundation.

## Greeting Decision

The default greeting combines a fixed configurable prefix and a time-based greeting:

`Assalamualaikum, Good morning/afternoon/evening/night, [Name]`

The prefix, time messages, custom greeting mode, and display-name inclusion are configurable.

## Page Model Decision — 2026-09-30

The previous Workspace implementation was too close to a generic Node/folder manager. The intended product model is now explicit:

- User-created Nodes are **Pages** in the UI.
- Workspace is the **Page Builder**.
- Parent-child hierarchy is structural only.
- Settings controls how a Page works: fields, capabilities, capability configuration, visibility and presentation.
- A Page may be allowed in the left sidebar, but sidebar visibility is opt-in.
- A Page may be allowed on the Dashboard independently.
- Page Detail is the runtime surface for using the configured Page.
- Dashboard, Calendar and Settings remain the fixed system areas.

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
\n## Current Builder State — 2026-09-30\n\nThe Universal Node Builder now persists node identity, custom fields, capability bindings, capability configuration, visibility/presentation settings, and Node-bound Dashboard widget instances. Dashboard widget instances support saved view and title overrides. Workspace remains hierarchy-focused; Settings remains the configuration surface.\n