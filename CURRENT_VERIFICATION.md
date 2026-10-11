# FocusOS — Current Verification

**Reconciled:** 2026-10-12

This document is the release-verification record for FocusOS. It distinguishes observed local checks, cloud CI runs, production checks, and remaining release risks. Do not mark a check as passed unless its result was observed.

## Project identity

- Repository: `mdanasaaq-design/FocusOS`
- Branch: `main`
- Firebase project: `focusos-7cd08`
- Production URL: `https://focusos-7cd08.web.app`

## Current verification state

### Local checks previously observed in the Termux checkout

| Check | Result | Notes |
|---|---|---|
| `npm test` | PASS (previously observed) | Core date/preference, planning contract, and preference tests passed after repairing malformed source newlines and preference normalization. Not rerun during this reconciliation. |
| `npm run build` | PASS (previously observed) | Vite production build completed successfully. Not rerun during this reconciliation. |
| `git status --short` | CLEAN at last local check | The temporary Playwright dependency-lock change was restored. This is not a claim about the current local checkout. |
| `npm run lint` | NOT RE-RUN during the recorded session | Earlier runs reported warnings but no errors; rerun before release sign-off. |

The build reported a bundle-size warning for the authentication chunk (over 500 kB minified). This is a performance optimization item, not a failed build.

### GitHub Actions

The following workflow files were added:

- `.github/workflows/production-smoke.yml`
- `tests/production-smoke.spec.js`

The production smoke workflow is configured for pushes to `main`, manual dispatch, and a weekly schedule. It runs `npm ci`, `npm test`, `npm run build`, installs Chromium in the cloud runner, and checks the production homepage.

**Latest observed state during this reconciliation:** the standard CI run and production smoke run for commit `cad56d768ac86e69e22ae2d85caf4f12941f3d5d` were both `in_progress`. Neither is recorded here as passed.

- [Standard CI run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38164579163)
- [Production smoke run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38164579182)
- [All GitHub Actions runs](https://github.com/mdanasaaq-design/FocusOS/actions)

Recheck the live run status before release sign-off. A run that is configured or in progress is not a successful verification result.

The current browser smoke test checks HTTP success, visible body content, and uncaught page-level JavaScript errors. It does **not** verify authentication, protected routes, Page/Node operations, tool views, record creation, Firestore ownership, or persistence.

### Production deployment

- Firebase Hosting deployment to `focusos-7cd08` was previously reported successful.
- The currently deployed site has **not** been verified here against the latest `main` commit.
- A passing homepage smoke test alone is not sufficient evidence that authenticated product workflows work.

## UI contracts previously reviewed

- Dashboard greeting is rendered above the dashboard grid.
- Greeting prefix and time-based greeting are separate lines.
- Greeting is not represented as a dashboard grid widget.
- Dashboard grid is non-editable on the Dashboard itself; customization is managed through Settings.
- Live clock supports configured 12-hour/24-hour output and two-digit seconds when enabled.
- `/workspace` redirects to `/pages`.
- `/settings/legacy` redirects to `/settings/configuration`.

These are documented prior code-review observations, not fresh checks in this reconciliation. Recheck them if related code changes.

## Required end-to-end verification

Use a dedicated test account and disposable test data for workflows that write to Firestore.

1. Authentication: profile setup, login/logout, protected routes, and re-login.
2. Dashboard: greeting, clock, widget configuration, saved layouts, and responsive layout.
3. Pages: create, rename, reorder, nest, move, archive/restore, and delete.
4. Page integrity: moving a Page changes its workspace hierarchy without silently reassigning records or Node relationships; deleting a Page does not implicitly delete underlying records.
5. Nodes: create, edit, nest, reparent, configure, archive/restore, and persist after refresh.
6. Node integrity: validate parent references, cycle rejection, and derived ancestor paths after moves.
7. Tool discovery and standalone use: open a tool without requiring a permanent user-created Page.
8. Tool views: place a tool in a Page and verify per-view filters/layout can differ without duplicating or mutating the underlying records.
9. Shared records: verify the same records are visible and consistent through standalone tools and multiple Page views where supported.
10. Tool and record associations: verify association and display are separate where supported, and Page-originated creation applies the documented default association behavior.
11. Activity/history: verify tool records, history, and dashboard summaries remain consistent.
12. Calendar and scheduling: event creation, Node links, visibility, Timetable behavior, conflict detection, and persistence.
13. Legacy compatibility and migration: Tasks, Pomodoro/Focus Sessions, Exercise/Workout, Habits, and Study/Work data.
14. Persistence: verify saved state survives refresh and a new authenticated session.
15. Security: verify Firestore rules and owner isolation using an emulator or controlled test environment.
16. Accessibility and responsive behavior: mobile layout, keyboard navigation, visible focus, and accessible labels.

## Known release gaps

- The latest observed standard CI and production smoke runs were in progress during this reconciliation; their final outcomes must be checked.
- Authenticated Playwright end-to-end tests are not yet implemented.
- Firestore Emulator/rules integration tests are not yet part of CI.
- Lint warnings remain to be reviewed.
- The authentication bundle-size warning remains.
- The current production deployment has not been verified here against the latest `main` commit.
- Trash purge is app-triggered rather than server-scheduled.
- The target Tool Registry, independent tool launcher/runtime, and per-view configuration model must not be treated as implemented merely because they are documented in `architecture.md` and `tasks.md`.

## Release sign-off rule

Do not describe FocusOS as production-ready solely because the build or homepage smoke test passes. Release sign-off requires current automated checks, authenticated end-to-end verification, Firestore ownership/rules verification, data-integrity tests for Page/Node/record relationships, and a production smoke test against the deployed commit.
