# FocusOS Data Model, Ownership, and Safe Migration

**Status:** Describes the current persisted model and the approved migration procedure. It is not a claim that every planned specialist collection already exists.

## Ownership boundary

User data is stored below `users/{uid}/...`. Firestore rules permit reads and writes only when the authenticated user's UID matches the path UID. Client-side validation is additional integrity protection; it is not a substitute for Firestore rules.

## Current collections and responsibilities

| Path | Current responsibility | Important boundary |
|---|---|---|
| `users/{uid}/profile/main` | Profile and onboarding state | One owner profile |
| `users/{uid}/pages/{pageId}` | Page identity, parent relation, navigation/presentation config, tool-view placements | Page is workspace structure, not the owner of records |
| `users/{uid}/nodes/{nodeId}` | General-purpose Nodes and their parent/path hierarchy | `parentId` is authoritative; `path` is a derived ancestor cache |
| `users/{uid}/nodes/{nodeId}/activity/{activityId}` | Node history/audit events | History belongs to the Node |
| `users/{uid}/nodes/{nodeId}/values/{dateKey}` | Dated Node values | Independent of Page hierarchy |
| `users/{uid}/activity/{activityId}` | Legacy generic operational records used by Tasks, Focus, Habits, timers, workouts, goals, and related features | This remains a legacy shared collection; dedicated specialist collections are a future migration |
| `users/{uid}/config/tools` | Global tool defaults | Defaults do not replace Page-local view overrides |
| `users/{uid}/userCapabilities/{capabilityId}` | User-defined capability definitions | Definitions are separate from operational records |
| `users/{uid}/reminders/{reminderId}` | Calendar/reminder events | Legacy Calendar event store |

The registry's `recordModel.status` must identify legacy storage honestly. A tool registry entry does not imply a dedicated collection exists.

## Page associations versus display

Activity records retain the legacy `pageId` field for compatibility and add `pageIds` as the association set. The normalized `pageId` is a compatibility alias for the first associated Page; `pageIds` represents all Page associations.

- Creating a record inside a Page associates it with that Page by default.
- Creating a record from a standalone tool leaves it unassociated unless the user explicitly associates it.
- A view's record-scope setting controls what it displays; it does not itself add or remove associations.
- The Task view's association editor changes the record's Page associations, not the current view configuration.
- Deleting a Page removes that Page ID from record associations but does not delete the records or their history.
- Existing records that only have `pageId` remain readable and are normalized into the association model when updated.

Page hierarchy and Node hierarchy remain independent. Reparenting a Page must not change a Node's parent/path or rewrite record associations.

## Node path integrity and repair

A Node's `parentId` is authoritative. Its `path` contains ancestor IDs from root to parent and excludes the Node itself. Node moves validate parent existence, namespace, archived-parent restrictions, and cycles. A large move is written in Firestore-safe chunks because each batch is limited to 500 writes.

A chunked operation cannot be atomic across an arbitrarily large subtree. If a write fails after some chunks commit, the authoritative parent relationship remains in `parentId`; use `repairNodePaths(uid, moduleKey)` to recompute materialized paths from the parent graph. The repair refuses missing parents and cycles instead of guessing.

## Safe specialist-record migration

The generic `activity` collection is retained until each specialist replacement is implemented and verified. Never perform an in-place destructive rewrite as the first migration step.

For each tool migration:

1. **Inventory and backup:** count records by discriminator, capture representative records and references, and create a restorable export before writes.
2. **Dry run:** calculate destination IDs, record counts, required field transformations, missing references, and collision behavior without changing data.
3. **Additive copy:** write into a versioned specialist collection with deterministic destination IDs or an explicit `legacyActivityId`; retain original IDs and ownership.
4. **Idempotency:** persist a migration marker keyed by tool and migration version. Re-running the same migration must not duplicate records.
5. **Verification:** compare counts, IDs, dates, status, metadata/history, associations, and relationship references. Report unmatched and malformed records for manual review.
6. **Read cutover:** switch the tool to the new collection only after verification succeeds. Keep legacy reads available during the rollback window.
7. **Rollback:** switch reads back to the legacy source and leave the additive destination intact for diagnosis. Do not delete the legacy source during rollback.
8. **Retirement:** only remove legacy records after a separate explicit retention decision, a verified backup, a successful release window, and an auditable confirmation.

Migration tooling must be owner-scoped, dry-run by default, resumable, and must not silently discard unknown metadata. Never run destructive migration against real user data during automated tests.

## Verification requirements

- Emulator tests must prove owner writes succeed and cross-owner/unauthenticated writes fail.
- Domain tests must cover Page subtree lifecycle, multi-Page associations, Node cycle/missing-parent rejection, and path repair.
- E2E tests must cover shared records across views, explicit association changes, standalone creation, Page deletion preserving records, and refresh persistence.
- Production smoke success alone does not prove authenticated data integrity or confirm that the current `main` revision is deployed.
