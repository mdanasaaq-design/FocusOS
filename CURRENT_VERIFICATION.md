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

The Playwright setup now uses separate explicit configurations:

- `playwright.smoke.config.mjs` targets `tests/production-smoke.spec.js`.
- `playwright.config.mjs` targets the emulator-backed `e2e/` suite.
- The conflicting `playwright.config.js` was removed.
- Both workflows list discovered tests before running them.
- Browser reports, screenshots, and traces are uploaded when a workflow fails.

The post-merge `verify` job (lint, unit tests, and build) passed for main commit `a2006ffb7c7457f700dc01705008f3b26ec41042`. The emulator-backed `e2e` job for that commit is still running at the time of this reconciliation. The Page-deletion fix and initial Tool Registry/standalone-launcher PR each passed their own verify and E2E jobs before merge.

- [Latest CI workflow](https://github.com/mdanasaaq-design/FocusOS/actions)
- [Latest production smoke workflow](https://github.com/mdanasaaq-design/FocusOS/actions)

Historical smoke runs failed while Hosting was built with an invalid Firebase API key. The post-merge production smoke run `38169448995` passed after the local `.env` was corrected and Hosting redeployed. This workflow tests the currently deployed URL; it does not deploy the new main commit, so a green smoke result proves live-site health but does not prove that newly merged code is live.

- [Earlier diagnostic failure](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38165782246)
- [Successful post-merge production smoke run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38169448995)

The source also catches startup-module failures and renders an explanatory startup screen rather than leaving a blank page.

### Production deployment

- Production URL: `https://focusos-7cd08.web.app`.
- The user corrected the local `.env`, ran `npm run deploy:hosting`, and confirmed that deployment completed successfully and the production app works.
- The latest production smoke run `38169448995` provides automated browser evidence that the currently deployed page mounts and passes the configured smoke assertions. It is not a substitute for full authenticated workflow verification, and it does not prove that commits merged after the last manual deploy are live.
- Firebase configuration values remain local environment configuration and must not be committed. Do not print or copy the API key into source files, Markdown, logs, or screenshots.
- `README.md` documents the required Firebase Console values. `npm run deploy:hosting` runs a configuration preflight, builds the app, and deploys Hosting. It rejects missing/placeholder API keys, the wrong project ID, and emulator mode.
- The preflight checks configuration shape and project selection; the live smoke test confirms Firebase accepts the deployed configuration.

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

- Production is currently reachable and the latest configured production smoke run passed. Full authenticated production workflows have not been comprehensively verified.
- Authenticated browser coverage is still partial; the current E2E suite covers dashboard UI, Page creation/capability navigation, standalone tool launch/task creation, and time-format persistence, not every lifecycle or data-integrity requirement.
- Firestore rules/owner-isolation tests, broader Page/Node relationship integrity tests, accessibility coverage, and mobile responsive regression tests remain incomplete.
- The permanent Page-deletion data-integrity fix is merged in commit `5e8ceacb6f27085e16ade07b4bde21f300b4003f`. It detaches Page references from Nodes and activity records, preserves those records and nested Node history, and deletes only Page documents. Unit tests and the emulator-backed browser suite passed in CI. A dedicated Firestore-emulator assertion that exercises record retention through the real deletion adapter remains desirable before calling the entire Page lifecycle fully verified.
- The authentication bundle-size warning remains a performance optimization item.
- Trash purge is app-triggered rather than server-scheduled.
- The initial versioned Tool Registry and independent Tools launcher/runtime are now implemented. Remaining architecture gaps include persistent global tool settings, multiple independently configurable tool placements per Page, specialized record models/migration away from the generic `activity` collection, and full association-vs-display controls.

## Release sign-off rule

Do not describe FocusOS as production-ready solely because the build or homepage smoke test passes. Release sign-off requires current automated checks, authenticated end-to-end verification, Firestore ownership/rules verification, data-integrity tests for Page/Node/record relationships, and a production smoke test against the deployed commit.
