# FocusOS — Rules

## 1. Product Rules

1. FocusOS is a universal configurable operating system.
2. Do not add hard-coded student, college, work, health, finance, or religious categories as mandatory product structure.
3. Everything the user creates begins as a Node unless it is explicitly a fixed system feature.
4. The only fixed system areas are Dashboard, Calendar, and Settings.
5. Examples are not requirements and must not become hidden defaults.
6. The user defines hierarchy, naming, grouping, visibility, and workflow.
7. Capabilities must remain separate from Nodes.
8. Views must remain separate from data and behavior.

## 2. Data Rules

1. Preserve real user history.
2. Never replace persistent records with temporary UI-only state.
3. Never perform destructive migrations without explicit approval.
4. Prefer additive schema changes.
5. Normalize missing values safely.
6. Validate data before writing to Firestore.
7. Firestore rules must enforce owner-only access.
8. Do not expose secrets or commit `.env` files.

## 3. Development Rules

1. Inspect existing code before changing it.
2. Make the smallest safe change that satisfies the requirement.
3. Reuse existing utilities and domain functions when possible.
4. Do not duplicate business logic across components.
5. Keep pure business logic outside React components.
6. Avoid broad rewrites when an incremental migration is safer.
7. Do not delete legacy functionality until replacement behavior is verified.
8. Use meaningful commit messages.
9. Verify changes with a build and relevant tests before deployment.
10. Update project documentation when architecture or decisions change.

## 4. UI Rules

1. UI must be configurable where the product requirement says it is configurable.
2. Do not assume English, Gregorian calendar, a particular time zone, or a particular greeting.
3. Accessibility is a first-class requirement.
4. Avoid visual clutter and unexplained controls.
5. The Dashboard homepage is a viewer by default; editing belongs in Settings or an explicit editor mode.
6. Sidebar entries are navigation choices, not automatic representations of every Node.
7. Preserve user-entered values during editing and validation errors.

## 5. Capability Rules

1. A capability describes behavior, not identity.
2. Capability configuration must be validated.
3. User-created capabilities must not execute arbitrary untrusted code.
4. Built-in capabilities must be registered through a controlled registry.
5. Capability keys should remain stable after release.
6. Capability data must have clear ownership and lifecycle rules.

## 8. Page Rules

1. User-created Nodes are presented as Pages in the user experience.
2. Page hierarchy and Page navigation visibility are separate concerns.
3. Creating a Page must not automatically require a sidebar entry.
4. Page behavior is configured through fields, capabilities, capability configuration and presentation settings.
5. Workspace is the Page Builder; Settings is the configuration surface; Page Detail is the runtime surface.
6. Do not create product categories by treating parent Pages as predefined life areas.

## 6. Collaboration Rules

1. GPT acts as product manager and architect.
2. Claude acts as implementation engineer.
3. The user is the owner and final approver.
4. No major scope expansion without explicit approval.
5. Approved scope must be recorded in the task and decision documents.
6. Implementation must follow `prd.md`, `architecture.md`, `rules.md`, and `design.md`.

## 7. Deployment Rules

1. Run the production build before deployment.
2. Deploy only after reviewing changed files.
3. Deploy Firestore rules separately when they change.
4. Verify authentication, protected routes, dashboard rendering, and data persistence after deployment.
5. Record deployment-related failures and resolutions in project memory or tracking documents.
