# FocusOS — Current Verification

**Reconciled:** 2026-10-12

This document records observed verification separately from planned work. A green build or smoke test does not prove that every authenticated workflow or the current source revision is deployed.

## Project identity

- Repository: `mdanasaaq-design/FocusOS`
- Branch: `main`
- Firebase project: `focusos-7cd08`
- Production URL: https://focusos-7cd08.web.app
- Latest main commit at reconciliation: `1c56db6ac0dcfc1e5f2f5c482a67df00eb45337c`

## Observed checks

### User-confirmed Termux deployment

The user ran `git pull origin main` and `npm run deploy:hosting` successfully for commit `a2006ffb7c7457f700dc01705008f3b26ec41042`.

- Firebase configuration preflight passed for `focusos-7cd08`.
- Vite production build completed.
- Firebase Hosting uploaded 41 files and released the new version.
- Hosting URL: https://focusos-7cd08.web.app
- The build reported a non-fatal authentication chunk warning: `auth-CFBWhC98.js` was 547.74 kB minified.

The user subsequently confirmed the deployed app was working. This confirms that the Hosting deployment command completed; it does not mean later main commits are deployed.

### GitHub Actions

- [Latest main CI run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38174554173): both `verify` and the emulator-backed `e2e` job passed for commit `1c56db6`.
- [Latest production smoke run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38174554302): passed against the currently deployed URL.
- [Smoke run after the user-confirmed deployment](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38173974092): passed.
- [Page tool-view placement PR](https://github.com/mdanasaaq-design/FocusOS/pull/15): verify and emulator-backed E2E passed before merge.
- [Global tool defaults PR](https://github.com/mdanasaaq-design/FocusOS/pull/16): verify and emulator-backed E2E passed before merge.
- [Page hierarchy move PR](https://github.com/mdanasaaq-design/FocusOS/pull/17): verify and emulator-backed E2E passed before merge.

The production smoke workflow tests the existing Hosting URL; it does not deploy the current main commit. Therefore a passing smoke result is evidence that the currently deployed site initializes and passes its configured smoke assertions, not proof that commit `1c56db6` is live.

## Architecture work now implemented

1. A versioned Tool Registry defines stable tool keys, supported Page/standalone views, actions, record-model metadata, and validated configuration schemas.
2. The Tools launcher and standalone runtime are separate from Pages; launching a tool does not create a permanent Page.
3. Pages can store multiple stable-ID tool-view placements. Multiple Tasks views on one Page read and update the same underlying activity records.
4. Global tool defaults persist under the user's `config/tools` document. Supported Focus and Habits settings can be overridden per Page view.
5. Page reparenting validates parent existence and blocks moving a Page under itself or a descendant. The persistence operation changes only the moved Page's `parentId`; descendants, Nodes, and activity records are not rewritten.
6. The Node hierarchy contract script is included in `npm test`.

The E2E suite now covers the dashboard, Page creation and capability navigation, multiple Tasks views sharing records, standalone Tasks creation, global Focus defaults and a Page-specific override, Page moves preserving descendants, and time-format persistence.

## Deployment boundary

The last user-confirmed Hosting deployment used commit `a2006ff`. The newer main commits `2904c64`, `3c0900d`, and `1c56db6` add Page tool-view placements, global defaults, and safe Page reparenting, respectively. These newer commits have **not yet been confirmed deployed**.

After pulling the latest main, run:

```bash
cd ~/FocusOS
git pull origin main
npm run deploy:hosting
```

Keep `.env` local. After the deployment, run the **FocusOS Cloud Smoke Tests** workflow from GitHub Actions to test the new live build.

## Remaining release and architecture gaps

- Authenticated E2E coverage remains partial; login/logout, protected-route behavior, and re-login still need a complete dedicated regression flow.
- Firestore owner isolation and security rules need direct emulator tests.
- Page deletion has a pure data-preservation contract test, but direct Firestore-emulator coverage of the real deletion adapter is still missing.
- Page ordering/reordering and the complete archive/trash/restore/delete lifecycle need broader verification.
- The distinction between record association and display scope is not fully implemented. Activity records still use the legacy single `pageId` association; multi-Page associations and a Page view that displays records without associating them require follow-up work.
- Specialist operational data still uses the generic activity collection. A safe, reversible migration to dedicated tool record models remains unfinished.
- Tool view configuration currently supports declared schema fields, not the complete planned filters, sorting, grouping, visible-field, and layout system.
- Accessibility, keyboard navigation, mobile responsiveness, and broader calendar/scheduling regression coverage remain incomplete.
- The authentication chunk-size warning remains a performance optimization item.

## Release sign-off rule

Do not describe FocusOS as fully production-ready solely because CI or the homepage smoke test passes. Sign-off still requires current code deployed to Hosting, authenticated workflow verification, Firestore ownership/rules verification, and data-integrity coverage for Page, Node, and record relationships.
