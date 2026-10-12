# FocusOS — Architecture

## 1. Purpose and Status

This document defines the technical architecture FocusOS is moving toward: the main concepts, their boundaries, their relationships, the responsibilities of each system layer, and the rules that protect data integrity.

It is an architectural target, not a claim that every described capability is already implemented. The current application contains a Page data model, a separate Node data model, existing specialist-tool routes, and Firebase/Firestore persistence. The unified tool runtime and registry described below are architectural direction and must be introduced incrementally.

Use these documents for their distinct purposes:

- `prd.md` — product requirements and intended user experience.
- `architecture.md` — technical concepts, boundaries, contracts, and rules.
- `tasks.md` — work to do.
- `CURRENT_VERIFICATION.md` — checks actually run and evidence currently available.

When implementation differs from the target, record the difference as implementation status or verification work; do not treat the target design as proof of completion.

## 2. Architectural Principles

1. **User-defined structure:** FocusOS must not force users into predefined life categories or workflows.
2. **Distinct concepts:** Pages organize workspaces; Nodes represent general-purpose organizational entities; tools provide functionality; specialized records store operational data; views present data.
3. **One source of truth:** A record displayed in multiple places remains one record. A view or Page must not create an accidental duplicate.
4. **Separate hierarchies:** Page parent-child relationships and Node parent-child relationships serve different purposes and remain separate.
5. **Configurable composition:** A Page may combine information and multiple tool views. A tool may also run independently.
6. **Local presentation, shared data:** A view may have its own filters and layout without changing the underlying records or other views.
7. **Safe lifecycle operations:** Moving, hiding, archiving, or deleting a workspace must not silently reassign or destroy underlying records.
8. **Incremental evolution:** Preserve working features and user data. Introduce the target architecture in verifiable steps rather than rewriting the application solely for conceptual consistency.
9. **Explicit contracts:** Built-in and future tools must integrate through documented contracts, not arbitrary coupling to Page internals.
10. **Evidence-based status:** Design, implementation, and verification are separate states.

## 3. Core Domain Concepts

### 3.1 Page

A **Page** is a configurable workspace and user-facing application area. It is one Page concept, not separate technical entity types for Master Pages, subpages, and tool Pages.

A Page may have:
- A stable identity and owner.
- A name, description, icon, color, and ordering.
- An optional parent Page and zero or more child Pages.
- Navigation and presentation configuration.
- Zero or more tool-view placements.
- References to Nodes or records that it presents.
- Page-specific display configuration.

Any Page may contain subpages. Nesting is recursive and must not have a product-imposed shallow depth limit. A Page with children functions as a parent or “Master Page”; that is a role arising from its relationships, not a different entity type. A Page with no children is still a complete Page.

The fixed system areas Dashboard, Pages, Calendar, and Settings are system surfaces. User-created Pages can appear alongside them in navigation according to user configuration. The Pages system area manages Page hierarchy and workspace organization; tool discovery and launching are separate concerns.

A tool opened independently can be presented through a Page-like runtime without requiring a permanent user-created Page. If a user wants a persistent workspace for that tool, they can create or configure a Page for it.

### 3.2 Node

A **Node** is a general-purpose organizational entity, such as a subject, project, goal, area of responsibility, or other user-defined concept. Nodes can form their own hierarchy and can be linked to records and displayed by Pages or tools.

Nodes are not Pages, and Node hierarchy does not define Page navigation. A Node may be shown on a Page without being owned by that Page or automatically appearing in navigation.

A Node may contain identity, description, parent relationship, ordering, custom fields, and supported domain relationships. It may also reference capabilities where that is useful, but it must not become a universal container for every operational record.

### 3.3 Tool

A **Tool** is a reusable feature implementation that performs a kind of work, such as Tasks, Habits, Timetable, Exercise, Focus Sessions, Notes, or Measurements.

Tools can:
- Launch independently through a tool-discovery/launcher interface.
- Render a view inside a Page.
- Render multiple configured views across Pages.
- Manage specialized records through their own domain/data contracts.

A tool is not itself a record and does not have to be a permanent system navigation module. Existing specialist routes are legacy application surfaces to be migrated only when the corresponding new experience is ready and verified.

### 3.4 Tool View / Placement

A **Tool View** is a configured presentation of a tool in a specific context. A placement identifies the tool and its view configuration; it does not contain a copy of the tool's underlying records.

Examples:
- Studies Page → Tasks view filtered to incomplete study tasks.
- Personal Life Page → Tasks view filtered to personal tasks.
- Standalone Tasks → broader view across the user's tasks.

Each view can configure filters, grouping, sorting, visible fields, and layout independently. Global tool settings provide defaults; per-view settings override those defaults. View configuration must not silently mutate record properties.

### 3.5 Specialized Record

A **Specialized Record** is operational data managed by a tool's domain model, such as a task, habit definition, habit log, focus session, calendar event, workout set, or measurement.

Not all specialized records should be forced into the Node schema. Tools may use data structures appropriate to their domain, with explicit validation and stable identifiers. Where a record represents an organizational concept, it may link to a Node; where it records an event or measurement, it can remain a specialized record.

### 3.6 Capability

A **Capability** is a defined behavior or operation a tool or Node can support. Capability concepts can describe reusable behavior, but they must not blur the distinction between a tool implementation, a record, a Page placement, and a Node.

The target architecture uses a controlled registry for built-in tools and capabilities. Future extensions must use validated schemas and defined interfaces rather than arbitrary executable code supplied as configuration.

### 3.7 Fixed System Areas

FocusOS has four fixed system areas:
- **Dashboard** — renders the user's configured overview.
- **Pages** — creates, organizes, and navigates workspaces.
- **Calendar** — provides calendar and scheduling surfaces.
- **Settings** — configures application preferences and supported system behavior.

Tasks, Habits, Exercise, Timetable, and similar specialist features should not become additional permanent system areas merely because they have dedicated tool interfaces.

## 4. Relationships and Data Ownership

The architecture distinguishes four separate relationships:

1. **Page hierarchy:** which Page is the parent of another Page.
2. **Node hierarchy:** which Node is the parent of another Node.
3. **Record association:** which workspace or organizational context a record is associated with.
4. **View placement:** where and how a tool displays records.

These relationships must not be inferred from one another without an explicit product rule.

A task can, for example, be associated with Studies, linked to a Web Technologies Node, and shown in standalone Tasks plus one or more Page-specific Tasks views. It remains the same task record.

### 4.1 Record association defaults

When a user creates a record from within a Page, associate it with that Page by default when the record type supports Page association. Let the user choose to create a general record instead. The association is organizational metadata, not exclusive ownership by the Page.

A record may be associated with multiple workspaces where supported. A Page may also display a record without associating it with that Page. The UI must distinguish association from display/linking.

### 4.2 Shared data and local presentation

Changes to record properties—such as a task's title, due date, or completion status—apply to the single underlying record and are reflected in every view.

View-local properties—such as filters, grouping, sort order, visible fields, and layout—apply only to that view. Any Page-specific display treatment must be explicit and must not masquerade as a change to the record itself.

### 4.3 Moving Pages

Moving a Page changes its parent and navigation position. Its descendant Pages move with it. The move must not automatically reassign associated records or alter Node relationships. Any record reassignment is a separate, explicit operation.

### 4.4 Deleting Pages

Deleting a Page removes the workspace structure according to the supported deletion lifecycle; it must not implicitly delete the underlying tasks, habits, sessions, Nodes, or other records merely because they were displayed or associated there. Records that remain referenced elsewhere must remain accessible.

Page deletion behavior must be implemented consistently with the existing trash/archive/restore lifecycle and retention policy. Permanent deletion of Page metadata and deletion of underlying records are distinct operations. No destructive behavior should be introduced without explicit review and migration/testing.

## 5. Tool Registry and Contracts

The target architecture uses a central **Tool Registry** as the discoverable catalog of supported tools. The registry is a definition/catalog, not a single storage bucket for every tool's data.

A tool definition should specify, as applicable:

- Stable key and display metadata.
- Availability and compatibility information.
- Supported actions/capabilities.
- Specialized record types and data access contract.
- Supported standalone and Page-embedded views.
- Global configuration defaults and validation.
- Per-view configuration schema and validation.
- Navigation/launcher metadata.
- Versioning and migration requirements.

The runtime resolves a tool by its stable key and renders a supported view using its validated configuration. A Page stores a placement/reference and placement configuration, not executable code or duplicated records.

Tools may have different internal record models. Shared conventions should be introduced only where they provide a clear cross-tool benefit—for example owner scoping, stable IDs, timestamps, validation, activity history, and export/retention rules.

The registry and unified runtime are target architecture; they are not assumed to exist fully in the current codebase. Introduce them incrementally, starting with a small number of tools and preserving existing behavior.

## 6. System Layers

### 6.1 Presentation Layer

Responsible for:
- Routing and navigation.
- Page workspace rendering and recursive Page navigation.
- Standalone tool launcher and tool interfaces.
- Tool-view rendering and local presentation controls.
- Dashboard, Calendar, Settings, accessibility, and responsive behavior.

It must not duplicate domain rules or own persistence semantics.

### 6.2 Application Layer

Responsible for coordinating use cases:
- Creating, editing, moving, archiving, restoring, and deleting Pages.
- Creating and organizing Nodes.
- Launching tools and placing tool views in Pages.
- Creating and updating specialized records through tool contracts.
- Resolving associations and references.
- Managing global and per-view configuration.
- Coordinating preferences, Dashboard, Calendar, and onboarding.

### 6.3 Domain Layer

Responsible for pure, testable rules:
- Page hierarchy validation and cycle prevention.
- Node hierarchy validation and cycle prevention.
- Ordering and reparenting semantics.
- Record association and reference validation.
- Tool registry definition and configuration validation.
- Record-specific rules, recurrence, and progress calculations.
- Configuration normalization and safe defaults.
- Archive, trash, restore, and deletion invariants.

Page-tree operations and Node-tree operations must remain distinct domain contracts.

### 6.4 Data Layer

Responsible for:
- Firebase Authentication integration and owner scoping.
- Firestore reads, writes, subscriptions, and query helpers.
- Serialization, normalization, and persistence-boundary validation.
- Mapping existing storage structures to domain contracts.
- Additive migrations and compatibility handling.
- Safe batch operations and deletion/retention workflows.

### 6.5 Infrastructure Layer

Responsible for:
- Firebase configuration and hosting.
- Firestore security rules.
- Environment handling.
- Build, test, CI, and deployment configuration.
- Observability and error reporting where available.

## 7. Data Model and Persistence Boundaries

The current application uses separate Firestore-backed Page and Node collections under a user scope. Preserve that separation unless measured query patterns and an explicit migration plan justify a change.

Current known structures include:
- `users/{uid}/pages/{pageId}` for Pages and Page configuration.
- `users/{uid}/nodes/{nodeId}` for Nodes and Node-specific fields/configuration.
- Additional specialist-tool collections or records for their respective operational data.

This is a description of current storage boundaries, not a mandate that every future tool use one particular collection layout. The final storage model for tool definitions, placements, specialized records, events, and global/per-view configuration should be chosen according to access patterns, Firestore rules, transaction/batch limits, and migration safety.

### 7.1 Page contract

Conceptually, a Page includes:
- `id`, `ownerId`
- `parentId` (nullable)
- `name`, `description`, `icon`, `color`
- `order` or equivalent navigation ordering
- `navigationConfiguration`
- `viewPlacements` / Page configuration
- `createdAt`, `updatedAt`
- Explicit archive/trash/retention state where applicable

The current implementation uses a `config` object and fields including `parentId`, `archived`, `trashedAt`, timestamps, and navigation/presentation options. Do not rename or migrate fields merely to match this conceptual vocabulary; use adapters or a planned migration when necessary.

### 7.2 Node contract

Conceptually, a Node includes:
- `id`, `ownerId`, nullable `parentId`
- `name`, description and identity/presentation fields
- `order`
- `customFields` / domain fields
- Supported relationships and capability references
- `createdAt`, `updatedAt`
- Explicit archive/retention state where applicable

In the current implementation, Node documents include fields such as `moduleKey`, `pageId`, `parentId`, `path`, `tracking`, `capabilities`, `capabilityConfig`, `presentation`, and `fields`. Some legacy module namespaces remain readable. Treat these as current implementation details; do not assume every field belongs in the long-term universal contract.

### 7.3 Node path invariant

For the current Node tree, `parentId` is the source of truth. The `path` array is a derived materialized ancestor list used to support subtree operations. It contains ancestor IDs in root-to-parent order and excludes the Node's own ID. Root Nodes have an empty path.

Never change `path` independently of `parentId`. Node creation and reparenting must validate ownership, parent existence, namespace constraints where still applicable, and cycles, then update descendant paths consistently.

Do not copy this Node path field into Page hierarchy by default. Page hierarchy has its own relationship contract and validation.

### 7.4 Ownership and access

Persistent user data must be scoped to its owner. Domain validation and Firestore security rules must both enforce the intended access model; client-side checks alone are insufficient. Cross-record references must not permit a user to reference or mutate another user's private data.

## 8. Configuration Architecture

Configuration has distinct scopes:

- **User/application preferences:** language, region, time zone, calendar behavior, accessibility, theme, and other account-wide settings.
- **Global tool configuration:** defaults for a tool across contexts.
- **Page configuration:** workspace identity, navigation, hierarchy presentation, and Page-level composition.
- **Per-view configuration:** filters, grouping, sorting, visible fields, and layout for one placement.
- **Record properties:** the actual operational data managed by a tool.

Configuration must have schema validation, normalization, and safe defaults. Missing or invalid optional configuration should not cause data loss. A view configuration must not be used as a hidden substitute for record-level properties.

## 9. Dashboard and Calendar

### 9.1 Dashboard

Dashboard is a fixed system area. It renders saved layout/widget configuration; editing that configuration belongs in the appropriate configuration interface.

A dashboard widget or data source should reference the relevant tool, Node, or record scope explicitly. It must not duplicate source records or maintain totals that can drift from source data when those totals can be derived reliably.

The existing Dashboard configuration approach should be retained and evolved incrementally. Do not assume that every widget already uses the future Tool Registry contract.

### 9.2 Calendar

Calendar is a fixed system area and a presentation surface for calendar-related data. Events may be standalone or associated with Nodes and/or Pages when the event type supports those relationships.

Calendar views must respect configured calendar system, locale, time zone, date/time formatting, and first day of week. Time conversion and recurrence rules belong in shared domain/application logic, not duplicated across screens.

## 10. Legacy Tool Migration

Existing specialist routes include Timetables, Study, Pomodoro, Exercise, and Habits. These are current application surfaces, not proof that the target registry-based runtime is complete.

For each tool, migrate incrementally:

1. Inventory the current interface, data model, persistence behavior, and routes.
2. Define the tool contract and specialized record model.
3. Define standalone and Page-embedded view behavior.
4. Preserve existing record IDs and history where possible.
5. Add an explicit, repeatable migration only where storage changes are necessary.
6. Verify old and new views against the same source records or validate the migrated result.
7. Retire or redirect the legacy route only after replacement behavior and data integrity are verified.

Never silently discard history, duplicate records, or reassign records simply because a tool is moved into a Page. Maintain a rollback/recovery plan for data migrations.

## 10.1 Current Persistence Compatibility

The current application still stores several specialist record types in the owner-scoped legacy `users/{uid}/activity` collection. Tasks are the first specialized collection at `users/{uid}/tasks`: new Task writes use that collection, while the unified read adapter continues to include legacy Tasks. An explicit additive migration copies legacy Tasks with stable source references, deduplicates reads, mirrors updates to migrated sources during the rollback window, and can remove only migration-created copies. Other tools must declare legacy generic storage until their dedicated models are implemented and verified.

For activity records, `pageIds` is the association set; `pageId` remains a compatibility alias for older views and integrations. A Page view's display scope is independent of the association set. A record can be displayed in a Page without association, or associated with multiple Pages without being duplicated. Page deletion detaches only deleted Page IDs from these associations and preserves the record and history.

Node `parentId` remains the authoritative hierarchy. `path` is a materialized ancestor cache and may be repaired from the parent graph. A repair must reject missing parents or cycles rather than silently guessing. Large hierarchy operations must respect Firestore's per-batch write limit and document the recovery operation if a multi-batch write is interrupted.

The persisted collection inventory and safe, reversible migration procedure are maintained in `docs/data-model-and-safe-migration.md`.

## 11. Testing and Verification Strategy

Testing should validate domain invariants first, then data operations, then integrated user workflows.

Minimum architecture test areas:

- Page hierarchy: create, nest recursively, reorder, move, reject cycles, archive/trash/restore.
- Node hierarchy: parent validation, cycle prevention, path derivation, descendant path updates.
- Separation of Page and Node hierarchies.
- Tool registry key resolution and configuration validation.
- Standalone tool launch and Page-embedded view rendering.
- Multiple views reading and updating the same underlying record.
- Per-view configuration isolation and global defaults.
- Record association defaults and general/unassociated records.
- Page move preserving record associations and Node relationships.
- Page deletion preserving underlying records and shared references.
- Owner-scoped reads/writes and Firestore security rules.
- Dashboard and Calendar normalization, date/time behavior, and persistence.
- Legacy-route compatibility and migration/rollback behavior.

Pure domain rules should be testable without Firebase or React where practical. Automated tests and build checks do not replace authenticated end-to-end testing or Firestore rules verification. The actual evidence and remaining gaps belong in `CURRENT_VERIFICATION.md`.

## 12. Migration and Change Rules

- Prefer additive, reversible changes where practical.
- Preserve existing user data and history.
- Do not make a structural Page operation implicitly mutate record associations.
- Do not replace working legacy routes before the new runtime is verified.
- Use explicit schema versions or migration markers when a data transformation requires them.
- Validate migration results and keep a recovery/rollback plan.
- Avoid speculative collection fragmentation; choose storage from real query and security requirements.
- Update this architecture when an intentional design decision changes, and update verification separately when implementation evidence changes.

## 13. Future Awwab Layer

Awwab is a future assistant layer above FocusOS, not the foundation of its data model. It should use validated application/domain interfaces for context retrieval, planning, memory, calendar interaction, notifications, automation, and voice.

Awwab must respect user permissions, record ownership, domain validation, and the same data-integrity rules as the main application. It must not bypass those rules or mutate arbitrary Firestore documents directly.
