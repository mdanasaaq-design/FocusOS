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

The E2E tests were updated to match the current UI. The dashboard greeting/clock/navigation test passed in the first refreshed run. The next tests exposed a real runtime bug in `src/components/Sidebar.jsx`: the Page icon map referenced Lucide icons that were not imported. Those icons have now been imported. Re-run the E2E suite on the latest commit before considering browser regression verification complete.

- [Latest CI workflow](https://github.com/mdanasaaq-design/FocusOS/actions)
- [Latest production smoke workflow](https://github.com/mdanasaaq-design/FocusOS/actions)

**Observed production failure:** Playwright successfully discovers the smoke test, but the deployed page does not mount React. Browser diagnostics report `Firebase: Error (auth/invalid-api-key).` The body and `#root` are empty, and there are no failed network requests or HTTP error responses. This is a production Firebase Web configuration/deployment problem, not a test-discovery failure.

- [Production smoke run with Firebase API-key diagnostics](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38165782246)

The source now catches startup-module failures and renders an explanatory startup screen instead of leaving a blank page. That change is not present in Hosting until a valid configuration is used to rebuild and deploy.

### Production deployment

- Production URL: `https://focusos-7cd08.web.app`.
- The currently deployed site is **broken**: the production smoke test confirms `auth/invalid-api-key` and an empty React root.
- No valid Firebase Web API key is available in the repository or through the connected GitHub tools. Do not guess or commit a replacement key.
- `README.md` now documents the required Firebase Console values. `npm run deploy:hosting` runs a configuration preflight, builds the app, and deploys Hosting. It rejects missing/placeholder API keys, the wrong project ID, and emulator mode.
- The preflight can validate format and project selection, but only the live smoke test can confirm Firebase accepts the key.
- After a valid `.env` is supplied, run `npm run deploy:hosting`, then rerun the production smoke workflow. Do not mark production as fixed until that smoke test passes.

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

- **Production is not healthy:** deployed Firebase configuration returns `auth/invalid-api-key`; the valid Firebase Web API key must be supplied from Firebase Console and Hosting redeployed.
- The startup-error UI and guarded deployment command are committed but have not yet been deployed to Hosting.
- Playwright test discovery is fixed for both suites; rerun the current E2E suite after the Sidebar icon import fix.
- The production smoke test currently fails correctly because the deployed site cannot initialize Firebase.
- Authenticated browser coverage is still partial; the E2E suite covers dashboard UI, Page creation/capability navigation, and time-format persistence only.
- Firestore rules/ownership tests, broader Page/Node relationship integrity tests, accessibility coverage, and mobile responsive regression tests remain incomplete.
- Lint, unit tests, and the production build have passed in the latest standard CI verification run.
- The authentication bundle-size warning remains a performance optimization item.
- Trash purge is app-triggered rather than server-scheduled.
- The target Tool Registry, independent tool launcher/runtime, and per-view configuration model must not be treated as implemented merely because they are documented in `architecture.md` and `tasks.md`.

## Release sign-off rule

Do not describe FocusOS as production-ready solely because the build or homepage smoke test passes. Release sign-off requires current automated checks, authenticated end-to-end verification, Firestore ownership/rules verification, data-integrity tests for Page/Node/record relationships, and a production smoke test against the deployed commit.
