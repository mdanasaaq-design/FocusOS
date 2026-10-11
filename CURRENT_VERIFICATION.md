# FocusOS — Current Verification

**Reconciled:** 2026-10-11

This document is the release-verification record for FocusOS. It distinguishes locally verified results, cloud CI results, production checks, and remaining release risks. Do not mark a check as passed unless its result was observed.

## Project identity

- Repository: `mdanasaaq-design/FocusOS`
- Branch: `main`
- Firebase project: `focusos-7cd08`
- Production URL: `https://focusos-7cd08.web.app`

## Current verification state

### Local checks observed in the Termux checkout

| Check | Result | Notes |
|---|---|---|
| `npm test` | PASS | Core date/preference, planning contract, and preference tests passed after repairing malformed source newlines and preference normalization. |
| `npm run build` | PASS | Vite production build completed successfully. |
| `git status --short` | CLEAN at last check | The temporary Playwright dependency-lock change was restored. |
| `npm run lint` | NOT RE-RUN in this session | Earlier runs reported warnings but no errors; rerun before release sign-off. |

The build reported a bundle-size warning for the authentication chunk (over 500 kB minified). This is a performance optimization item, not a failed build.

### Cloud browser smoke testing

A GitHub Actions workflow and a Playwright smoke test were added:

- `.github/workflows/production-smoke.yml`
- `tests/production-smoke.spec.js`

The workflow is configured to run on pushes to `main`, manual dispatch, and a weekly schedule. It runs `npm ci`, `npm test`, `npm run build`, installs Chromium in the cloud runner, and checks the production homepage.

**Status: configured; successful GitHub Actions execution has not yet been confirmed in this document.** Check the [GitHub Actions runs](https://github.com/mdanasaaq-design/FocusOS/actions) before treating cloud verification as passed.

The current browser smoke test checks HTTP success, visible body content, and uncaught page-level JavaScript errors. It does **not** verify authentication, protected routes, Pages, capabilities, task creation, or persistence.

### Production deployment

- Firebase Hosting deployment to `focusos-7cd08` was previously reported successful.
- Verify the deployed site against the current `main` commit before release sign-off.
- A passing homepage smoke test alone is not sufficient evidence that authenticated product workflows work.

## UI contracts previously reviewed

- Dashboard greeting is rendered above the dashboard grid.
- Greeting prefix and time-based greeting are separate lines.
- Greeting is not represented as a dashboard grid widget.
- Dashboard grid is non-editable on the Dashboard itself; customization is managed through Settings.
- Live clock supports configured 12-hour/24-hour output and two-digit seconds when enabled.
- `/workspace` redirects to `/pages`.
- `/settings/legacy` redirects to `/settings/configuration`.

These are documented prior code-review observations and should be rechecked if related code changes.

## Required end-to-end verification

1. Login, profile setup, protected routes, logout, and re-login.
2. Dashboard greeting, clock, widgets, and responsive layout.
3. Pages: create, rename/edit, capability configuration, navigation visibility, dashboard pinning, archive/delete behavior.
4. Node creation, nesting, movement, detail/configuration, and persistence after refresh.
5. Capability runtime and Page activity/history.
6. Dashboard widget/layout persistence through Settings.
7. Calendar and reminder interactions.
8. Timetable creation, conflict detection, and completion persistence.
9. Tasks, Pomodoro, Exercise, and Habits compatibility.
10. Verify that data remains correct after refresh and a new authenticated session.
11. Mobile layout, keyboard navigation, focus visibility, and accessible labels.
12. Firestore rules and ownership isolation using an emulator or a controlled test environment.

Use a dedicated test account and disposable test data for workflows that write to Firestore. Never run destructive tests against real user data.

## Known release gaps

- The GitHub Actions smoke workflow has been added, but its first successful run still needs confirmation.
- Authenticated Playwright end-to-end tests are not yet implemented.
- Firestore emulator/rules integration tests are not yet part of CI.
- Lint warnings remain to be reviewed.
- The authentication bundle-size warning remains.
- Trash purge is app-triggered rather than server-scheduled.

## Release sign-off rule

Do not describe FocusOS as production-ready solely because the build or homepage smoke test passes. Release sign-off requires current automated checks, authenticated end-to-end verification, Firestore ownership/rules verification, and a production smoke test against the deployed commit.
