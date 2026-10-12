# FocusOS — Current Verification

**Reconciled:** 2026-10-12

This document records observed verification separately from planned work. A green build or smoke test does not prove that every authenticated workflow or the current source revision is deployed.

## Project identity

- Repository: `mdanasaaq-design/FocusOS`
- Branch: `main`
- Firebase project: `focusos-7cd08`
- Production URL: https://focusos-7cd08.web.app
- Latest main commit at reconciliation: `589c483416572a7b595227c6b4010665a882e828`

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

- [Latest main CI run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38247343887): `verify` and emulator-backed `e2e` passed for commit `589c4834`.
- [Latest production smoke run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38247343883): passed against the existing Hosting URL. It does not deploy the new commit or prove that `589c4834` is live.
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
6. Tasks views support validated per-view sorting, grouping, compact/list layout, and due-date/priority visibility; settings are available in both the Page editor and standalone Tools launcher.
7. The Node hierarchy contract script is included in `npm test`.

The E2E suite now covers protected-route login/logout/re-login, Page creation and capability navigation, Page archive/restore with descendants, multiple Tasks views sharing records, configurable Tasks view presentation, standalone Tasks creation, global Focus defaults and a Page-specific override, Page moves preserving descendants, and time-format persistence. This PR adds Trash restore/permanent-delete coverage and verifies that underlying tasks remain available after a Page subtree is deleted.

## Deployment boundary

The last user-confirmed Hosting deployment used commit `a2006ff`. Newer main commits include Page tool-view placements, global defaults, safe Page reparenting, authenticated regression coverage, and configurable Tasks views. These newer commits have **not yet been confirmed deployed**.

After pulling the latest main, run:

```bash
cd ~/FocusOS
git pull origin main
npm run deploy:hosting
```

Keep `.env` local. After the deployment, run the **FocusOS Cloud Smoke Tests** workflow from GitHub Actions to test the new live build.

## Remaining release and architecture gaps

- The core protected-route login/logout/re-login flow is covered; authentication error handling, session expiry, and account recovery still need broader verification.
- Firestore owner-only rules have direct emulator coverage: owner writes are allowed, while cross-user and unauthenticated writes are denied.
- This PR adds browser regression coverage for Trash restore, permanent Page-subtree deletion, and preservation of underlying task records; additional Node/history relationship edge cases remain to be verified.
- Page ordering/reordering and less common archive/trash/restore/delete edge cases need broader verification.
- The distinction between record association and display scope is not fully implemented. Activity records still use the legacy single `pageId` association; multi-Page associations and a Page view that displays records without associating them require follow-up work.
- Specialist operational data still uses the generic activity collection. A safe, reversible migration to dedicated tool record models remains unfinished.
- The initial Tasks view supports sorting, grouping, layout, and visible-field controls. Filtering and equivalent configuration for other tools remain unfinished.
- Accessibility, keyboard navigation, mobile responsiveness, and broader calendar/scheduling regression coverage remain incomplete.
- The authentication chunk-size warning remains a performance optimization item.

## Release sign-off rule

Do not describe FocusOS as fully production-ready solely because CI or the homepage smoke test passes. Sign-off still requires current code deployed to Hosting, authenticated workflow verification, Firestore ownership/rules verification, and data-integrity coverage for Page, Node, and record relationships.
