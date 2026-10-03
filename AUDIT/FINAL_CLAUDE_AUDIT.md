# FINAL CLAUDE AUDIT — FocusOS
Repo main @ 07cd4e3 · audited 2026-10-03 · AUDIT ONLY: no application file changed, no commit, nothing pushed.
Full per-item detail (problem/evidence/why/change/files/dependencies) is in `APPENDIX_B_FULL_BACKLOG_FOS-001_to_038.md`; narrative sections A–J in `APPENDIX_A_...`. Section files 01–11 hold the per-section evidence.
**Not verified:** live application (no credentials/browser; sandbox cannot reach *.web.app) — all runtime/visual claims are code-derived.

## 1. Executive Summary
FocusOS has the right foundation (owner-only Firestore, empty-by-default Pages, one shared activity stream, normalizers, additive migration) but is a three-generation codebase (legacy specialist apps, generic Nodes, Pages+capabilities). One data-loss path (trash cascade), two crash/correctness defects (invalid time zone, UTC "today"), a dead Analytics tab, a broken Focus timer, and unreachable builders mean the product does not yet deliver "the user builds their own FocusOS". Activity→Target→Schedule→History→Insights is half real.

## 2. Current Architecture
See 02_ARCHITECTURE.md. Pages (`pages`) → capabilities → `activity`; parallel Nodes (`nodes`); legacy collections still feed Dashboard/Calendar; ~36% of src lines legacy/dead.

## 3. Critical Findings
| ID | Area | Evidence | Explanation / user impact / technical impact | Action | Conf. |
|---|---|---|---|---|---|
| FOS-001 | Data lifecycle | `src/data/pages.js` trashPage, permanentlyDeletePage, purgeExpiredTrash; `Sidebar.jsx` PageTree; confirms in `Workspace.jsx`, `SettingsHub.jsx` | Trashing a parent flags only it; purge/Delete-now deletes all descendants + their activity/nodes; children vanish from nav meanwhile. Irreversible loss of un-trashed Pages' history. | Owner decision on subtree semantics; cascade-trash/restore together or prompt; confirmation with counts; test | High |
| FOS-002 | Settings/resilience | `preferences.js` normalizePreferences (no tz/locale check); `SystemPreferences.jsx`/`ProfileSetup.jsx` free text; no ErrorBoundary; reproduced `RangeError: Invalid time zone specified: India` | A typo blanks the Dashboard on every load; recovery only via manual URL. Technical: Intl throws in render. | Validated pickers; normalize with Intl probe; error boundary with reset | High |
| FOS-003 | Dates | `src/lib/dates.js` todayKey (UTC); PageCapabilityRuntime Tasks recurrence; reproduced under TZ=Asia/Kolkata | Records filed on wrong day 00:00–05:30 IST; daily recurring tasks regenerate same due date; skews streaks/totals/dashboard. | Single tz-aware dayKey + tests; optional day-start hour; no silent rewrite of old data | High |

## 4. High Priority Findings
| ID | Area | Evidence | Explanation | Action | Conf. |
|---|---|---|---|---|---|
| FOS-004 | Analytics | PageCapabilityRuntime `Analytics` + subscription filtered to capability "analytics" | Always zero; insights dead | Read whole Page stream via domain fn | High |
| FOS-005 | Focus | PageCapabilityRuntime `Focus` (effect resets on !run; complete() inside setLeft updater) | Pause loses time; reload loses session; possible duplicate records | endsAt-based persisted session | High |
| FOS-006 | Settings/nav | `Settings.jsx` at `/settings/legacy` (unlinked) holds DashboardBuilder, capability builder, profile/Hijri, Archive | Core "build your own" features unreachable | Choose one config home; remount; add Archive; retire legacy route | High (repo)/F (live) |
| FOS-007 | Data/perf | `capabilityActivity.js` subscribeCapabilityActivity (full collection, client filter, slice) | Cost/latency grow; totals silently truncate | Server queries, indexes, pagination | High |
| FOS-008 | Architecture | `Dashboard.jsx` legacy subscriptions vs activity | Two focus/habit truths | Canonical metrics over activity; label legacy adapters | High |
| FOS-009 | Pages | `UserPage.jsx` Link to /workspace; `Workspace.jsx` selects pages[0] | Configure opens wrong Page | `/workspace/:pageId` deep link | High |
| FOS-010 | Capabilities | `modules/capabilities.js` (19 keys) vs runtime (11) | Attachable capabilities with empty tabs | status metadata; hide runtime-less/legacy | High |
| FOS-011 | Onboarding/defaults | `ProfileSetup.jsx` addNode; `DEFAULT_DASHBOARD`; `addDeadline` no callers | Invisible first node; unfillable Deadlines; duplicate date/clock; no-op Greeting toggle | Onboard to first Page; fix defaults | High |
| FOS-012 | Dashboard builder | `Settings.jsx` nodes={[]}; `Dashboard.jsx` node-capability stub | Page-bound widgets impossible/placeholder | Rebuild as Page+capability widgets | High |
| FOS-013 | Mobile | `DraggableDashboardGrid.jsx` CSS (!important, 84px, overflow hidden) | Probable clipped widgets <768px | Verify at 375px first | Medium (F) |

## 5. Medium Priority Findings
FOS-014 Delete-now incomplete/clock-based purge (pages.js) · FOS-015 trashed Pages counted (Dashboard) · FOS-016 Calendar isolated/ignores prefs (Calendar.jsx) · FOS-017 a11y/language prefs no-ops (preferences.js, index.css) · FOS-018 Hijri tabular vs Umm al-Qura, adjustment orphaned (lib/hijri.js) · FOS-019 goal/analysis semantics (Goals, Dashboard) · FOS-020 Page fields daily-scoped (UserPage, pages.js) · FOS-021 History mutable/capped/unexportable · FOS-022 capability CRUD/undo/states · FOS-023 Page Builder form bugs (new-Page parent filter, draft overwrite, labels, sidebar default) · FOS-026 navigation gaps · FOS-027 accessibility remediation · FOS-028 legacy/dead code · FOS-029 duplicated implementations · FOS-030 logic in components/tests/CI · FOS-031 listener sprawl & missing error callbacks · FOS-032 docs drift · FOS-035/036/037 product suggestions. Each has evidence, impact, action, confidence in Appendix B (confidence mostly High).

## 6. Low Priority Findings
FOS-024 literal "\n" at PageCapabilityRuntime.jsx:168 (High conf.) · FOS-025 naming/breadcrumb/dialog consistency · FOS-033 security/dependency notes (Medium) · FOS-034 load performance (Medium) · FOS-038 optional presets (Low).

## 7. Data Integrity Risks — 03_DATA_INTEGRITY.md (FOS-001, 003, 007, 014, 015, 020, 021; node subcollection orphans; unbatched final page delete)
## 8. Security Risks — 08_SECURITY.md (rules correct but unvalidated; sign-up/App Check/deployed rules unverified; audit advisories likely unreachable; do not downgrade firebase)
## 9. UX Issues — 05_UI_UX.md (FOS-006, 009, 010, 011, 012, 023, 025, 037)
## 10. Accessibility Issues — 06_ACCESSIBILITY.md (FOS-027, 017)
## 11. Performance Issues — 09_PERFORMANCE_CODE_QUALITY.md (FOS-007, 031, 034)
## 12. Testing Gaps — 10_TESTING.md (no CI/npm test, stale failing assertion, regression matrix proposed) (FOS-030)
## 13. Architecture Conflicts — 11_PRODUCT_CONSISTENCY.md (two hierarchies, split metrics, sidebar default vs PRD, PRD self-contradictions)

## 14. Legacy/Specialist Module Assessment
Do not delete specialist functionality or legacy data. Tasks/Focus/Time/Habits/Routines/Goals/Workouts/Measurements/Notes are already composed as Page capabilities. Mine legacy Timetables (schedule model), Study (hierarchy → child Pages; remove student-specific placeholder), and prayer data code for future capabilities. Keep legacy read-only import path; retire unlinked routes only after owner-verified migration. Dead: Tasks.jsx, Academics.jsx, ProgressRing.jsx (399 lines).

## 15. Recommended Implementation Order
1) CI + `npm test` + repair stale test + date/trash/preferences tests (FOS-030) · 2) FOS-002 validation + error boundary · 3) FOS-001 trash semantics (after owner decision) · 4) FOS-003 dayKey · 5) quick fixes FOS-024, 009, 023a · 6) FOS-005 Focus · 7) FOS-007/031 data layer + providers · 8) FOS-004 Analytics · 9) FOS-006 config home + FOS-011 first run · 10) FOS-008/012 metrics & widgets · 11) FOS-010/022 capability completeness · 12) FOS-016/018 calendar & Hijri · 13) FOS-017/027 accessibility · 14) FOS-028/029 legacy cleanup (owner-approved) · 15) FOS-032 docs, 035–038 product work.
## 16. Items That Should NOT Be Changed
See Appendix A §J: owner-only rules structure; activity envelope and history-survives-disable; empty-by-default Pages; normalizers; additive idempotent migration; Archive/Trash/Restore/Delete-now model (fix cascade only); pure domain modules + Node tests; lazy routes, design tokens, focus ring, reduced-motion, lang/dir; layout-config/renderer separation; no fixed specialist modules.
## 17. Unverified Items
Live app behaviour/console/first paint; mobile layout & RTL; screen reader & Calendar keyboard model; Firebase console (self sign-up, deployed rules=repo, indexes, leftover "B.Tech" study program); Hijri vs local sighting; behaviour at scale; reachability of grpc advisories; whether `npm run lint` (vs oxlint used) differs.
## 18. Final Audit Status
All 11 sections complete (single run). Implementation files modified: NO. Commits: none. Pushes: none (and not possible from this sandbox). 13 owner decisions listed in Appendix B "NEXT ACTIONS".
