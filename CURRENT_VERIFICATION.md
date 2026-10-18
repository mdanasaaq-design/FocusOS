**Execution update (2026-10-18, retry-execution branch):** Added a shared chunk executor for Node path writes and deterministic failure-injection coverage that commits the first 450 writes, fails the next chunk, retries from the partially updated state, and verifies only stale paths are rewritten while unrelated Node data is preserved. This exercises the chunk-execution/retry seam with an injected adapter; **it is not an emulator-backed Firestore failure test**. Actual Firestore/emulator failure and retry remain an open gate. Local verification reported by the user on the preceding main checkout: `npm ci` passed, lint passed with 24 warnings and 0 errors, all `npm test` scripts passed, and `npm run build` passed (Vite transformed 1,891 modules; auth chunk warning remains). The local lockfile showed only a package version metadata mismatch (package.json 1.0.0 vs lockfile 0.0.0); this branch aligns the lockfile metadata. These local checks have not yet run on this branch.

**Execution update (2026-10-18):** Current `main` is `b7b5260f2ed899f222376065e347f0725fbda652` after PR #43 merged. PR #43 head `07f62e622a51f6e867b5f651b7b26c16f6c8abaa` passed both `verify` and emulator-backed `e2e` in [run 39126690766](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39126690766). Post-merge main CI [run 39126957561](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39126957561) passed both `verify` and emulator-backed `e2e`. Cloud Smoke [run 39126957655](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39126957655) passed against the existing Hosting site; it does not deploy source. The deployed Hosting source SHA and deployed Firestore rules remain unverified; no production deployment was performed.


# FocusOS — Current Verification

**Reconciled:** 2026-10-18

This document records observed verification separately from planned work. A green build or smoke test does not prove that every authenticated workflow or the current source revision is deployed.

**Phase 2A verification (2026-10-18):** PR #39 merged as [`07935d4adb56f8ce7e702a40c4d5aec319c7aec8`](https://github.com/mdanasaaq-design/FocusOS/commit/07935d4adb56f8ce7e702a40c4d5aec319c7aec8). Final PR-head CI [run 39116461546](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39116461546) passed both verification and emulator-backed E2E. The new E2E seeds records in all known top-level record families, deletes a Page, and verifies stable records, surviving Page associations, Node history/values, and a surviving Page remain. Main CI [run 39116702499](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39116702499) and Cloud Smoke [run 39116702538](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39116702538) passed on that commit. Cloud Smoke tests the existing Hosting URL and does not prove that this SHA is deployed.

**Phase 2B merged; Firestore failure-injection gate remains open:** PR #40 adds parentId-derived Node path reconstruction, chunked reparent writes, and a repeatable repair operation. Pure tests cover graph validation and chunk sizing. The retry-execution branch adds deterministic failure injection at the chunk-executor seam: first chunk succeeds, second fails, retry repairs the remaining stale path, and unrelated Node fields remain intact. This is not a real Firestore emulator failure. Do not mark Phase 2 complete until the failure/retry path is exercised through the actual Firestore data layer/emulator.


**Phase 1 update (2026-10-18):** The documentation plan merged as [`a0496ae27bac65c28e93d850489feeba05a66240`](https://github.com/mdanasaaq-design/FocusOS/commit/a0496ae27bac65c28e93d850489feeba05a66240). Main CI [run 39115347759](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39115347759) passed both `verify` and emulator-backed `e2e` jobs. Cloud smoke [run 39115347777](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39115347777) passed, including the deployed-website smoke test. The smoke workflow builds current source but tests the existing `https://focusos-7cd08.web.app` URL; it contains no deployment step, so it cannot establish that this SHA is live. No deployment identity or deployed-rules evidence has been found. Do not treat this as release sign-off. The detailed current findings and phase plan are in [`docs/PROJECT_AUDIT_AND_PHASE_PLAN.md`](docs/PROJECT_AUDIT_AND_PHASE_PLAN.md); phase gates are in [`docs/PHASE_EXECUTION_CHECKLIST.md`](docs/PHASE_EXECUTION_CHECKLIST.md).

**Verification update (2026-10-16):** [PR #34](https://github.com/mdanasaaq-design/FocusOS/pull/34) established repository working rules and reconciled the documentation set; its [CI run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38887659029) passed lint, unit/contract tests, production build, Firestore rules checks, and emulator-backed browser regression tests. [PR #33](https://github.com/mdanasaaq-design/FocusOS/pull/33) corrected permanent Page deletion to detach references from Nodes, activity, and specialist Tasks before deleting Page documents. Its [CI run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38887992252) passed the same full workflow. PR #33 was merged as `bb3bb267ecb91d13359d71f0633114034c2fa5b7`. These are CI results; no production deployment was performed.

## Project identity

- Repository: `mdanasaaq-design/FocusOS`
- Branch: `main`
- Firebase project: `focusos-7cd08`
- Production URL: https://focusos-7cd08.web.app
- Latest main commit with successful CI: `b7b5260f2ed899f222376065e347f0725fbda652` (run [39126957561](https://github.com/mdanasaaq-design/FocusOS/actions/runs/39126957561)).
- PR #33, #34, and #35 are merged; see the audit plan for current repository hygiene and remaining work.

## Observed checks

### User-confirmed Termux deployment

The user ran `git pull origin main` and `npm run deploy:hosting` successfully for commit `a2006ffb7c7457f700dc01705008f3b26ec41042`.

- Firebase configuration preflight passed for `focusos-7cd08`.
- Vite production build completed.
- Firebase Hosting uploaded 41 files and released the new version.
- Hosting URL: https://focusos-7cd08.web.app
- The build reported a non-fatal authentication chunk warning: `auth-CFBWhC98.js` was 547.74 kB minified.

The user subsequently confirmed the deployed app was working. This confirms that the Hosting deployment command completed; it does not mean later main commits are deployed.

### Recent GitHub Actions verification

- [PR #34 documentation-governance CI](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38887659029): passed `npm ci`, lint, unit/contract tests, production build, Firestore owner-only rules, and emulator-backed Playwright tests.
- [PR #33 Page-deletion fix CI](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38887992252): passed the full `verify` and `e2e` jobs, including the updated Page-lifecycle contract test and browser regression suite.
- PR #33 was merged as `bb3bb267ecb91d13359d71f0633114034c2fa5b7`. Neither PR deploys to Firebase Hosting.
- [Cloud Smoke Tests on merged main](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38888367048) passed against the existing Hosting URL for that commit. The workflow does not deploy source code and cannot prove the merged commit is live.

### Historical GitHub Actions

- [Previous successful main CI run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38250351884): `verify` and emulator-backed `e2e` passed for commit `307726a5`.
- [Previous successful production smoke run](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38250351935): passed against the existing Hosting URL.
- [Smoke run recorded during the previous audit](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38251185908): passed against the then-current Hosting URL. It did not deploy source changes.
- [Smoke run after the user-confirmed deployment](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38173974092): passed.
- [Page tool-view placement PR](https://github.com/mdanasaaq-design/FocusOS/pull/15): verify and emulator-backed E2E passed before merge.
- [Global tool defaults PR](https://github.com/mdanasaaq-design/FocusOS/pull/16): verify and emulator-backed E2E passed before merge.
- [Page hierarchy move PR](https://github.com/mdanasaaq-design/FocusOS/pull/17): verify and emulator-backed E2E passed before merge.

The production smoke workflow tests the existing Hosting URL; it does not deploy the current main commit. A passing smoke result therefore verifies only the deployed site's configured smoke assertions, not that the latest source revision is live.

### Page lifecycle hardening and verification

- Merged [PR #31](https://github.com/mdanasaaq-design/FocusOS/pull/31) after both CI jobs passed on its head: lint, unit/contract tests, production build, Firestore owner-only rules, and emulator-backed Playwright regression tests. The successful run is [GitHub Actions run 38297714778](https://github.com/mdanasaaq-design/FocusOS/actions/runs/38297714778).
- Permanent Page deletion rejects a missing root and refuses to delete a subtree if any descendant is not in Trash; rejected requests make no persistence calls.
- Expired-trash cleanup processes each expired subtree from its root once rather than invoking permanent deletion independently for every descendant.
- PR #33 resolved the specialist Task reference cleanup gap and the stale lifecycle assertion. The test now asserts that references in `nodes`, `activity`, and `tasks` are detached before Page documents are deleted, and that the complete Page-subtree ID list is preserved. Full CI, including emulator-backed E2E, passed on PR #33's head.

## Architecture work now implemented

1. A versioned Tool Registry defines stable tool keys, supported Page/standalone views, actions, record-model metadata, and validated configuration schemas.
2. The Tools launcher and standalone runtime are separate from Pages; launching a tool does not create a permanent Page.
3. Pages can store multiple stable-ID tool-view placements. Multiple Tasks views on one Page read and update the same underlying activity records.
4. Global tool defaults persist under the user's `config/tools` document. Supported Focus and Habits settings can be overridden per Page view.
5. Page reparenting validates parent existence and blocks moving a Page under itself or a descendant. The persistence operation changes only the moved Page's `parentId`; descendants, Nodes, and activity records are not rewritten.
6. Tasks views support validated per-view sorting, grouping, compact/list layout, due-date/priority visibility, status and priority filters, multi-Page associations, and editing those associations without duplicating records.
7. The Node hierarchy contract script is included in `npm test`.

The E2E suite covers protected-route login/logout/re-login, Page creation and capability navigation, Page archive/restore with descendants, Trash restore/permanent-delete with underlying task preservation, multi-Page Task associations and editing, multiple Tasks views sharing records, configurable Tasks view presentation, completed-task visibility and status/priority filters, standalone Tasks creation, global Focus defaults and a Page-specific override, Page moves preserving descendants, and time-format persistence. The Page-creation regression case uses the current Tool View placement flow rather than the legacy capability checkbox.

## Deployment boundary

The last user-confirmed Hosting deployment used commit `a2006ff`. No inspected evidence confirms that the audited main commit `2818f03c` or later source is deployed. Newer main commits include Page tool-view placements, global defaults, safe Page reparenting, authenticated regression coverage, configurable Tasks views and filters, the Page Trash lifecycle, multi-Page Task associations, and specialist Task-association cleanup during permanent Page deletion. These newer commits have **not yet been confirmed deployed**.

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


## Planning audit disposition

The 2026-10-18 audit distinguishes CI-verified behavior from manual/live verification and historical findings that require revalidation. It does not change application code or deploy. Track follow-up through [the audit plan](docs/PROJECT_AUDIT_AND_PHASE_PLAN.md) and [the phase checklist](docs/PHASE_EXECUTION_CHECKLIST.md). In particular, broaden preservation tests beyond Tasks, verify deployed rules and source provenance, reconcile stale open PRs/issues, and test mobile/accessibility/timezone and specialist tool workflows before release sign-off.
