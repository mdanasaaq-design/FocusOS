# CLAUDE_AUDIT_STATE (source of truth for resuming)
Last updated: 2026-10-03 · main @ 07cd4e3

## Completed
0 Project baseline → 01_PROJECT_BASELINE.md
1 Architecture → 02_ARCHITECTURE.md
2 Data integrity → 03_DATA_INTEGRITY.md
3 Functionality → 04_FUNCTIONALITY.md
4 UI/UX → 05_UI_UX.md
5 Accessibility → 06_ACCESSIBILITY.md
6 Reliability → 07_RELIABILITY.md
7 Security → 08_SECURITY.md
8 Performance/code quality → 09_PERFORMANCE_CODE_QUALITY.md
9 Testing → 10_TESTING.md
10 Product consistency → 11_PRODUCT_CONSISTENCY.md
11 Final consolidated → FINAL_CLAUDE_AUDIT.md
Appendices: APPENDIX_A_NARRATIVE_AND_SECTIONS.md, APPENDIX_B_FULL_BACKLOG_FOS-001_to_038.md

## Current / Next
None outstanding. If resumed: re-run only the "deepening" items below, do NOT redo sections.

## Files inspected
All of src/ except line-by-line reads of legacy pages Study/Timetables/Exercise/Habits/Academics/Tasks (only structure, error-handling counts, routing, imports inspected), lib/timetable.js, lib/study.js, LiveClock, TimePicker internals, NodeDetail/NodeFieldBuilder/NodeFieldValueEditor/NodeCapabilityDataEditor internals, Calendar lines 140–563 (grep-level). Docs: README, prd, architecture, status, verification fully; CLAUDE.md/design.md/rules.md/tasks.md/CHANGELOG headings + key sections.

## Important findings
Critical: FOS-001 trash cascade; FOS-002 invalid tz crash; FOS-003 UTC day keys. High: FOS-004..013. Full list in FINAL_CLAUDE_AUDIT.md.

## Unresolved questions / deepening candidates (need browser or console)
- Live: mobile Dashboard clipping (FOS-013); /settings/legacy unlinked on live build; console errors.
- Firebase console: self sign-up, deployed rules, indexes, leftover "B.Tech" study program.
- Read legacy Study/Timetables/Exercise line-by-line for reuse value (Section 14 mining).
- Run `npm run lint` and `npm run build` inside the repo itself (done only in scratch copy with oxlint).
- 13 owner decisions pending (Appendix B, NEXT ACTIONS).

## Constraints honored
No application files modified; no commits; no pushes. Audit docs exist only in the local clone's AUDIT/ directory (not on GitHub).
