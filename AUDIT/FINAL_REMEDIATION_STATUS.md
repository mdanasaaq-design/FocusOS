# FocusOS — Full Audit Remediation Status

Updated: 2026-10-03

This document records the consolidated remediation pass against the 38-item Claude audit.

## Implemented in code

- FOS-001 — Page subtree trash/restore/delete integrity.
- FOS-002 — timezone/locale validation and global render recovery.
- FOS-003 — configured-timezone day semantics across core date paths and habit streaks.
- FOS-004 — Page Analytics consumes shared Page activity.
- FOS-005 — Focus pause preserves remaining time and phase transitions.
- FOS-006 — advanced configuration is reachable from Settings.
- FOS-007 — Page history no longer uses a silent 500-record cap.
- FOS-008 — Dashboard Page activity is now a first-class source and excludes trashed Page activity; legacy specialist sources remain for backward compatibility.
- FOS-009 — Configure opens the selected Page.
- FOS-010 — runtime-less legacy capabilities are explicitly identified.
- FOS-011 — onboarding creates Pages rather than invisible Nodes.
- FOS-012 — Page-bound Dashboard widgets are supported.
- FOS-013 — mobile dashboard clipping mitigation.
- FOS-014 — subtree-safe Delete now plus deterministic client purge; server-side cascade remains intentionally outside the free client-only architecture.
- FOS-015 — trashed Pages are excluded from Page activity Dashboard metrics.
- FOS-016 — Calendar reminders can be bound to Pages.
- FOS-017 — language, RTL, scale, density, contrast and target preferences are active; primary navigation is translated for supported languages.
- FOS-018 — configurable tabular/Umm al-Qura Hijri display with fallback.
- FOS-019 — shared Target/Insights contract and target-linked goal progress.
- FOS-020 — Page fields persist as stable Page properties; snapshots remain in history.
- FOS-021 — history is soft-deletable with undo and exportable.
- FOS-022 — generic history edit/hide/undo actions are available; specialist runtime records remain durable.
- FOS-023 — Page Builder parent-selection and current-Page configuration paths are hardened.
- FOS-024 — stray literal markup escape removed.
- FOS-025 — Page/Workspace terminology and current-Page Configure path aligned.
- FOS-026 — primary navigation is Dashboard / Pages / Calendar plus user Pages.
- FOS-027 — skip link, mobile active navigation, focus styles and large-target preferences improved.
- FOS-028 — legacy specialist data/routes preserved rather than destructively removed; retirement remains migration-gated.
- FOS-029 — Page-bound capability model is the shared runtime direction.
- FOS-030 — npm test, planning/date regression tests and CI added.
- FOS-031 — shared activity listener supports explicit error callbacks.
- FOS-032 — this remediation record is now maintained with the repository.
- FOS-033 — owner-only Firestore architecture retained; Firebase dependency was not downgraded.
- FOS-034 — Dashboard activity is bounded to a recent analysis window.
- FOS-035 — Activity → Target → Schedule → History → Insights contract added.
- FOS-036 — JSON backup export added.
- FOS-037 — Dashboard Customize mode supports drag/resize and persisted layout.
- FOS-038 — optional Page presets added.

## External verification still required

These are not code omissions: they require the deployed Firebase project/browser or an owner decision outside the repository.

1. Firebase Console rules/deployment state must be checked against the repository.
2. The live application must be exercised at 375px, desktop, RTL, and with an invalid timezone migrated from an existing account.
3. Firestore automatic retention cannot safely cascade-delete Page subcollections with TTL alone; the app therefore retains the explicit subtree purge path rather than enabling unsafe parent-document TTL deletion. Firebase documents that TTL deletion does not delete subcollections. 
4. Legacy specialist migration should be verified against real user data before deleting old routes/collections.
