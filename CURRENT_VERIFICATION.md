# FocusOS — Current Verification

**Reconciled:** 2026-10-12

This document records observed verification separately from planned work. A green build or smoke test does not prove that every authenticated workflow or the current source revision is deployed.

## Project identity

- Repository: `mdanasaaq-design/FocusOS`
- Branch: `main`
- Firebase project: `focusos-7cd08`
- Production URL: https://focusos-7cd08.web.app
- Latest main commit at reconciliation: `5a60376205bfe48fbc10526cc04a11a26d03fe56`

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

- [Previous successful main CI run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38250351884): `verify` and emulator-backed `e2e` passed for commit `307726a5`.
- [CI for current main commit](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38251185992): running at this reconciliation.
- [Previous successful production smoke run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38250351935): passed against the existing Hosting URL.
- [Smoke run for current main commit](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38251185908): passed against the existing Hosting URL. It does not deploy the new commit or prove that `5a603762` is live.
- [Smoke run after the user-confirmed deployment](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38173974092): passed.
- [Page tool-view placement PR](https://github.com/mdanasaaq-design/FocusOS/pull/15): verify and emulator-backed E2E passed before merge.
- [Global tool defaults PR](https://github.com/mdanasaaq-design/FocusOS/pull/16): verify and emulator-backed E2E passed before merge.
- [Page hierarchy move PR](https://github.com/mdanasaaq-design/FocusOS/pull/17): verify and emulator-backed E2E passed before merge.

The production smoke workflow tests the existing Hosting URL; it does not deploy the current main commit. Therefore a passing smoke result is evidence that the currently deployed site initializes and passes its configured smoke assertions, not proof that commit `5a603762` is live.

## Architecture work now implemented

1. A versioned Tool Registry defines stable tool keys, supported Page/standalone views, actions, record-model metadata, and validated configuration schemas.
2. The Tools launcher and standalone runtime are separate from Pages; launching a tool does not create a permanent Page.
3. Pages can store multiple stable-ID tool-view placements. Multiple Tasks views on one Page read and update the same underlying activity records.
4. Global tool defaults persist under the user's `config/tools` document. Supported Focus and Habits settings can be overridden per Page view.
5. Page reparenting validates parent existence and blocks moving a Page under itself or a descendant. The persistence operation changes only the moved Page's `parentId`; descendants, Nodes, and activity records are not rewritten.
6. Tasks views support validated per-view sorting, grouping, compact/list layout, due-date/priority visibility, status and priority filters, multi-Page associations, and editing those associations without duplicating records.
7. The Node hierarchy contract script is included in `npm test`.

The E2E suite now covers protected-route login/logout/re-login, Page creation and capability navigation, Page archive/restore with descendants, Trash restore/permanent-delete with underlying task preservation, multi-Page Task associations and editing, multiple Tasks views sharing records, configurable Tasks view presentation, completed-task visibility and status/priority filters, standalone Tasks creation, global Focus defaults and a Page-specific override, Page moves preserving descendants, and time-format persistence. This PR adds regression coverage for Task editing, due-date updates, and reopening completed Tasks.

## Deployment boundary

The last user-confirmed Hosting deployment used commit `a2006ff`. Newer main commits include Page tool-view placements, global defaults, safe Page reparenting, authenticated regression coverage, configurable Tasks views and filters, the Page Trash lifecycle, and multi-Page Task associations. These newer commits have **not yet been confirmed deployed**.

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
- Browser regression coverage now exercises Trash restore, permanent Page-subtree deletion, and preservation of underlying task records; additional Node/history relationship edge cases remain to be verified.
- Page ordering/reordering and less common archive/trash/restore/delete edge cases need broader verification.
- Tasks now support multiple Page associations while retaining the legacy `pageId` field for compatibility. Other record types still need association controls, and display-scope behavior needs broader verification.
- Specialist operational data still uses the generic activity collection. A safe, reversible migration to dedicated tool record models remains unfinished.
- Tasks support sorting, grouping, layout, visible-field controls, and multi-Page associations. This PR adds Task status and priority filters, including visibility for completed Tasks. Equivalent filtering and configuration for other tools remain unfinished.
- Accessibility, keyboard navigation, mobile responsiveness, and broader calendar/scheduling regression coverage remain incomplete.
- The authentication chunk-size warning remains a performance optimization item.

## Release sign-off rule

Do not describe FocusOS as fully production-ready solely because CI or the homepage smoke test passes. Sign-off still requires current code deployed to Hosting, authenticated workflow verification, Firestore ownership/rules verification, and data-integrity coverage for Page, Node, and record relationships.
