# FocusOS — Architecture and Product Decisions

This log records durable decisions that affect product behavior, architecture, data, or engineering workflow. It complements `prd.md`, `architecture.md`, and `design.md`; it does not replace them.

## How to maintain this log

- Add an entry when a decision is durable and has meaningful alternatives or trade-offs.
- State the date, status, decision, rationale, and consequences.
- Use **Accepted**, **Proposed**, **Superseded**, or **Rejected**.
- When superseding a decision, keep the old entry and link the replacement.
- Update the relevant source-of-truth document in the same change.
- Do not use this log for every implementation detail or temporary bug fix.

## D-001 — User-defined personal operating system

- **Status:** Accepted
- **Decision:** FocusOS is a configurable personal operating system. Users define their own organization and workflows; the product must not force them into fixed life categories.
- **Rationale:** The product should adapt to different people and uses rather than assume a student, professional, or particular lifestyle.
- **Consequences:** Prefer composable Pages and tools, flexible user-defined structure, and progressive configuration. Keep the initial experience understandable and do not expose unnecessary complexity by default.
- **Source:** `prd.md`, `architecture.md`

## D-002 — Distinct Page and Node concepts

- **Status:** Accepted; implementation and documentation must remain aligned with the current architecture contract.
- **Decision:** Page hierarchy and Node hierarchy are distinct. Pages organize user-facing workspaces; Nodes are general-purpose organizational entities. Do not merge their parent-child relationships or treat the two hierarchies as interchangeable.
- **Rationale:** They have different lifecycle and presentation responsibilities, and conflating them risks data integrity and navigation behavior.
- **Consequences:** Page and Node operations require separate validation and tests. Moving or deleting a Page must not silently rewrite Node relationships or destroy associated records.
- **Source:** `architecture.md`

## D-003 — Shared records, independent views

- **Status:** Accepted
- **Decision:** A record presented in a standalone tool and in one or more Page views remains the same underlying record. View-specific layout, filters, grouping, and visible fields are presentation configuration, not record data.
- **Rationale:** Users need consistent data across contexts without accidental duplication or cross-view configuration leakage.
- **Consequences:** Define explicit record association semantics, preserve stable IDs, and test updates across views. General/unassociated records must remain possible where supported.
- **Source:** `architecture.md`, `prd.md`

## D-004 — Incremental, reversible evolution

- **Status:** Accepted
- **Decision:** Preserve working features and existing user data while introducing architectural changes incrementally. Prefer additive migrations, validation, and rollback paths over destructive rewrites.
- **Rationale:** A conceptual cleanup must not compromise persisted records, history, or working user workflows.
- **Consequences:** Migrations need explicit preconditions, post-migration validation, and recovery plans. Legacy functionality must not be removed before replacement behavior is verified.
- **Source:** `architecture.md`

## D-005 — Documentation is part of implementation

- **Status:** Accepted
- **Decision:** Each change must update all affected project documents and distinguish intended behavior from implemented and verified behavior.
- **Rationale:** Architecture drift and stale verification notes lead to unsafe decisions and misleading completion claims.
- **Consequences:** Follow `AGENTS.md`; use `tasks.md` for backlog status, `CURRENT_VERIFICATION.md` for observed evidence, and this file for durable decisions.
- **Source:** `AGENTS.md`


## D-006 — Fixed system areas and separate tool launcher

- **Status:** Accepted
- **Decision:** The fixed system areas are Dashboard, Pages, Calendar, and Settings. Tools are discovered and launched through a separate tool-launching surface; a tool may run standalone or appear as a configured view inside a Page.
- **Rationale:** Core navigation should remain predictable while specialist functionality remains composable rather than becoming a permanent top-level system area for every feature.
- **Consequences:** Navigation, onboarding, and design documentation must preserve this distinction. Standalone and Page-embedded tool views must use the same underlying records.
- **Source:** `prd.md`, `architecture.md`, `design.md`

## D-007 — Evidence-driven phased completion plan (2026-10-18)

- **Status:** Accepted
- **Decision:** Follow the dependency-ordered phases in [the comprehensive audit and phase plan](PROJECT_AUDIT_AND_PHASE_PLAN.md) and use [the phase execution checklist](PHASE_EXECUTION_CHECKLIST.md) as phase gates.
- **Rationale:** Merged code and green CI do not independently prove live deployment, complete workflows, data preservation across every record family, or mobile/accessibility readiness.
- **Consequences:** Keep implementation, verification, and deployment status distinct. Compare stale PRs against current main before merging. Use reversible, user-triggered, additive migrations. Close phases only with evidence, residual risks, recovery plans, and synchronized documentation. Awwab remains deferred until stable permission-checked domain APIs exist.
