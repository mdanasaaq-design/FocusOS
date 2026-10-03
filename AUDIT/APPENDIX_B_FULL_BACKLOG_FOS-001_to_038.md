---

## K. Prioritized update backlog

Ordered by priority. Every item states its type (A–F), priority and confidence. Nothing here has been implemented.

### Critical

### FOS-001 — Trashing a parent Page silently destroys its un-trashed sub-Pages
**Area:** Pages / data lifecycle · **Type:** A · **Priority:** Critical · **Confidence:** High
**Problem:** `trashPage()` flags only the selected Page. `permanentlyDeletePage()` (used by the 30-day purge and by "Delete now") walks every descendant by `parentId` and deletes them all, together with their activity and nodes. Children that were never trashed are destroyed with no warning. Meanwhile the sidebar stops showing them the moment their parent is trashed, and the Trash list does not show them either.
**Evidence:** `src/data/pages.js` (`trashPage`, `permanentlyDeletePage`, `purgeExpiredTrash`); `Sidebar.jsx` `PageTree` only reaches children through a visible parent; the Workspace confirm text and the Settings "Delete now" confirm mention neither sub-Pages nor counts.
**Why it matters:** irreversible loss of history for Pages the user never chose to delete, after 30 days of silence.
**Recommended change:** owner decision (see Next Actions): either trash/restore the whole subtree together and list it under its parent in Trash, or require a choice at trash time (move children to root / cancel). In both cases the confirmation must state how many sub-Pages and records are affected. Add a unit test for the descendant set.
**Likely files:** `src/data/pages.js`, `src/pages/Workspace.jsx`, `src/pages/SettingsHub.jsx`, `src/components/Sidebar.jsx`.
**Dependencies:** owner decision on hierarchy semantics; FOS-014.

### FOS-002 — Invalid time zone or locale crashes the whole app
**Area:** Settings / resilience · **Type:** A · **Priority:** Critical · **Confidence:** High
**Problem:** Language, locale and time zone are free-text inputs saved without validation. An invalid time zone makes `Intl.DateTimeFormat` throw while the Dashboard renders. With no error boundary React unmounts everything (blank screen), and every reload of `/` repeats it. The same inputs appear in onboarding.
**Evidence:** `SystemPreferences.jsx` and `ProfileSetup.jsx` (text inputs); `preferences.js` `normalizePreferences` validates language, direction, scale and calendars but not `timeZone`/`locale`; experiment: `new Intl.DateTimeFormat("en-IN",{timeZone:"India"})` → `RangeError: Invalid time zone specified: India`; `Dashboard.jsx` calls `formatConfiguredDate` during render; no `ErrorBoundary` anywhere. Malformed locale tags fail the same way (not individually tested).
**Why it matters:** a typo locks the owner out of the home screen; recovery requires typing `/settings` manually.
**Recommended change:** replace the free-text fields with validated pickers (`Intl.supportedValuesOf("timeZone")`); make `normalizePreferences` probe `Intl` and fall back to defaults; add an app-level and per-route error boundary with a "go to Settings / reset preferences" action.
**Likely files:** `src/lib/preferences.js`, `src/components/SystemPreferences.jsx`, `src/pages/ProfileSetup.jsx`, `src/App.jsx`, `src/components/LiveClock.jsx`.
**Dependencies:** none.

### FOS-003 — "Today" is the UTC date; recurring tasks get wrong due dates
**Area:** Data integrity / dates · **Type:** A · **Priority:** Critical · **Confidence:** High
**Problem:** every "day" is `new Date().toISOString().slice(0,10)`, i.e. the UTC date, not the user's local or configured day. Records are filed under the wrong day for part of every day (00:00–05:30 IST for the owner; evenings in the Americas), and recurrence math round-trips local-midnight dates through `toISOString`, so for UTC+ users the "next" due date is a day early.
**Evidence:** `src/lib/dates.js` `todayKey`; Habits streak and Analytics buckets (`toISOString`); Tasks recurrence in `PageCapabilityRuntime.jsx`. Under `TZ=Asia/Kolkata`: at 02:00 IST on 4 Oct `todayKey()` returns `2026-10-03`; a *daily* recurring task due `2026-10-03` regenerates due `2026-10-03` (the same day); in UTC it correctly gives `2026-10-04`. Weekly/monthly use the same mechanism (not separately run). `preferences.timeZone` is used for display but never for date keys.
**Why it matters:** corrupts the History link of the chain — streaks, daily totals, dashboard series and recurrence — and hits exactly the pre-dawn hours.
**Recommended change:** one date module, e.g. `dayKey(date, timeZone, dayStartHour)` built on `Intl` parts, used everywhere; recurrence on date-only strings; unit tests across a time-zone matrix (UTC, Asia/Kolkata, America/Los_Angeles, DST boundaries). Optional "day starts at" preference. Do not rewrite existing records without explicit consent; document the boundary.
**Likely files:** `src/lib/dates.js`, `PageCapabilityRuntime.jsx`, `Dashboard.jsx`, `UserPage.jsx`, `data/pages.js` (`setPageValues`), `Calendar.jsx`, `lib/reminders.js`, legacy Pomodoro/Habits/Exercise.
**Dependencies:** owner decision on day semantics (Next Actions); new `scripts/test-dates.mjs`.

### High

### FOS-004 — Page Analytics tab always shows zeros
**Area:** Page runtime / insights · **Type:** A · **Priority:** High · **Confidence:** High
**Problem:** opening the Analytics tab subscribes only to records whose `capability` equals `"analytics"`; nothing ever writes those, so every tile and bar is empty. Separately, the 7d/30d toggle changes only the bar chart; the four summary tiles total all records.
**Evidence:** `PageCapabilityRuntime.jsx`: `active = capabilities.filter(key === onlyCapability)` → `subscribeCapabilityActivity(..., { capabilities: active })` → filtered by `item.capability`; `Analytics()` sums `items` without a range.
**Why it matters:** the Insights end of the chain is dead on Pages.
**Recommended change:** Analytics should read the whole Page stream, bucketed by range through a tested domain function; fix after FOS-007 and FOS-003.
**Likely files:** `PageCapabilityRuntime.jsx`, `data/capabilityActivity.js`, new `src/domain/insights.js`.
**Dependencies:** FOS-003, FOS-007.

### FOS-005 — Focus timer: Pause resets, state is not persisted, side effect in updater
**Area:** Page runtime / Focus · **Type:** A · **Priority:** High · **Confidence:** High (code trace; not browser-tested)
**Problem:** the effect `if (!run) setLeft(fullDuration)` depends on `run`, so pausing resets the remaining time. A running session lives only in component state, so changing tabs or reloading loses it; Time Tracking has the same weakness. `complete()` is called from inside a `setLeft` updater (double-fires under StrictMode in dev, producing duplicate records), and the countdown is tick-based so it drifts in background tabs.
**Evidence:** `PageCapabilityRuntime.jsx` `Focus` (lint also flags the effect at line 20); `TimeTracking` keeps `started` in state.
**Why it matters:** the flagship focus capability loses progress and can pollute history.
**Recommended change:** store an `endsAt` timestamp plus a persisted in-progress session; derive remaining time from the clock; complete from an effect/timeout with a once-only guard; same approach for Time Tracking; allow linking a session to a Task (the PRD calls for task association).
**Likely files:** `PageCapabilityRuntime.jsx` (split per capability), new `src/domain/focus.js`.
**Dependencies:** FOS-003.

### FOS-006 — Dashboard Builder and other settings are reachable only at an unlinked URL
**Area:** Settings / navigation · **Type:** A/B · **Priority:** High · **Confidence:** High for the repo; **verify on the live build (F)**
**Problem:** the Dashboard Builder (widgets, layouts, columns), "Create your own capability", display-name and Hijri-adjustment editing, and Page "Archive" exist only in `Settings.jsx`, mounted at `/settings/legacy`. Nothing links there. The reachable Settings (`/settings`) offers preferences, Trash, a link to the Page Builder and legacy migration only.
**Evidence:** `DashboardBuilder` is imported only by `Settings.jsx`; `/settings/legacy` appears only as a route in `App.jsx`; `archivePage` is called only from `Settings.jsx`; the Workspace "Archived Pages" box explains Archive but has no Archive button; `tasks.md` marks the builder items complete.
**Why it matters:** the central promise — the user builds their own dashboard and capabilities — is undiscoverable.
**Recommended change:** choose one home for configuration (Settings Hub sections, or a "Customize" mode on the Dashboard); mount the builder, capability builder and profile fields there; add an Archive action to the Page Builder; retire `/settings/legacy`.
**Likely files:** `App.jsx`, `SettingsHub.jsx`, `Settings.jsx` (split up), `Workspace.jsx`, `Dashboard.jsx`.
**Dependencies:** owner decision on where configuration lives; FOS-012.

### FOS-007 — Activity subscriptions download the whole collection; "limit" truncates silently
**Area:** Data / performance / correctness · **Type:** A/E · **Priority:** High · **Confidence:** High
**Problem:** `subscribeCapabilityActivity` listens to the entire `activity` collection and then filters, sorts and slices in the browser. A Page tab opens two such listeners (page + runtime); the Dashboard opens one with "limit 1000". Records beyond the cap vanish from History, Analytics and Dashboard totals.
**Evidence:** `capabilityActivity.js` (`onSnapshot(query(collection(...)))` with no `where`/`orderBy`/`limit`; `items.slice(0, limit)`); `firestore.indexes.json` is empty.
**Why it matters:** read cost and latency grow with all history of all Pages; totals become wrong once the cap is exceeded; the PRD requires date-range filtering.
**Recommended change:** server-side queries (`pageId`, optional capability/type, date range, `orderBy(date desc)`, `limit` with pagination); one shared subscription per Page via context; ranged or pre-aggregated reads for the Dashboard; add the composite indexes; show "latest N of M" when capped.
**Likely files:** `capabilityActivity.js`, `UserPage.jsx`, `PageCapabilityRuntime.jsx`, `Dashboard.jsx`, `firestore.indexes.json`.
**Dependencies:** FOS-003, FOS-031.

### FOS-008 — Dashboard reads legacy collections while Pages write the new stream
**Area:** Architecture / dashboard · **Type:** A/E · **Priority:** High · **Confidence:** High
**Problem:** the Habits, Pomodoro, Exercise and Timetable cards and the `habitCompletion`, `exerciseCompletion` and `scheduleCompletion` analysis sources read legacy collections. Page capabilities write to `activity`, which feeds only Focus minutes, Tracked minutes, Tasks, Notes and trackers. One Dashboard can show two different focus totals ("Pomodoro" = legacy; "Focus" analysis = activity). Migration copies data, so both stores stay live and drift apart.
**Evidence:** `Dashboard.jsx` subscriptions and `todayFocusMin` vs `analysisSeries("focusMinutes")`; `legacyMigration.js` is copy-only.
**Why it matters:** it breaks "one activity stream, many presentations" and users cannot trust the numbers.
**Recommended change:** define canonical metrics over `activity`; treat legacy sources as clearly-labelled adapters until migration is done; offer per-Page/per-capability widget sources (e.g. habit completion from the Habits capability).
**Likely files:** `Dashboard.jsx`, `modules/dashboard.js`, new `src/domain/insights.js`.
**Dependencies:** FOS-007, FOS-003; owner decision on retiring legacy.

### FOS-009 — "Configure" opens the wrong Page
**Area:** Page runtime / Workspace · **Type:** A · **Priority:** High · **Confidence:** High
**Problem:** the Page header's Configure button links to `/workspace` with no Page id; the Page Builder auto-selects the first Page, so for any other Page it opens somebody else's configuration.
**Evidence:** `UserPage.jsx` (`<Link to="/workspace">`); `Workspace.jsx` selects `pages[0]` and supports no route or query parameter (the legacy `Settings.jsx` handled `?node=`).
**Why it matters:** risk of editing or trashing the wrong Page; the Page → configure flow is broken.
**Recommended change:** route `/workspace/:pageId` (or `?page=`); deep-link from the Page header, after creation, and from the sidebar.
**Likely files:** `UserPage.jsx`, `Workspace.jsx`, `App.jsx`.
**Dependencies:** none.

### FOS-010 — Capabilities that can be attached but do nothing
**Area:** Capabilities / registry · **Type:** B · **Priority:** High · **Confidence:** High
**Problem:** Calendar, Reminders, Timetables, Files, "Pomodoro (legacy)", "Exercise (legacy)" and "Study / Work (legacy)" can be attached; each creates a tab and Overview tile that opens an empty "Tools" section. Tracking with no trackers renders nothing. Several overlap (Tracking, Measurements, trackers, Goals).
**Evidence:** `modules/capabilities.js` lists 19 built-ins; `PageCapabilityRuntime.jsx` implements 11 plus custom; `has("tracking") && trackers.map(...)`.
**Why it matters:** attaching a capability must produce behaviour; empty tabs read as broken.
**Recommended change:** list only capabilities that have a runtime (add `status: stable | preview | legacy` metadata in the registry and hide the rest); prompt to add a tracker when Tracking is attached; resolve overlaps (owner decision).
**Likely files:** `modules/capabilities.js`, `Workspace.jsx`, `UserPage.jsx`, `PageCapabilityRuntime.jsx`.
**Dependencies:** owner decision on the catalog.

### FOS-011 — First-run path is broken in several small ways
**Area:** Onboarding / dashboard defaults · **Type:** A/B · **Priority:** High · **Confidence:** High
**Problem:** (1) the onboarding "Create your first node" creates a legacy `core` node, which appears in no Pages UI; (2) the default Dashboard includes a Deadlines widget but nothing in the UI can create a deadline (`addDeadline` is never called); (3) the default layout shows the date and clock twice — in the header and as widgets; (4) the Builder's "Greeting" widget toggle has no effect (greeting is excluded from the grid); (5) onboarding does not lead to creating a first Page.
**Evidence:** `ProfileSetup.jsx` (`addNode(... moduleKey: "core")`); `data.js` `addDeadline` has no callers; `DEFAULT_DASHBOARD` plus the `Dashboard.jsx` header; `widget.key !== "greeting"`.
**Why it matters:** the first five minutes should demonstrate the philosophy; instead they show dead ends.
**Recommended change:** onboarding creates a Page (or nothing) and ends on an empty state with "Create your first Page"; remove Deadlines from defaults until a Page capability supplies it; de-duplicate date/clock; drop or implement the greeting widget.
**Likely files:** `ProfileSetup.jsx`, `modules/dashboard.js`, `Dashboard.jsx`.
**Dependencies:** FOS-006.

### FOS-012 — Page/Node-bound dashboard widgets cannot be created and show placeholder data
**Area:** Dashboard builder · **Type:** B · **Priority:** High · **Confidence:** High
**Problem:** the Builder is mounted with `nodes={[]}`, so "Add Node widget" can never be used; it targets Nodes, not Pages; and the `node-capability` widget renders only "N capabilities attached" with a bar computed as `count × 20 %`.
**Evidence:** `Settings.jsx` (`nodes={[]}`); `DashboardBuilder.jsx` `addNodeWidget`; `Dashboard.jsx` `renderWidget`; `tasks.md` marks "Page-bound capability dashboard widgets" complete.
**Why it matters:** this is the bridge between Pages and the Dashboard; today it is a stub.
**Recommended change:** rebuild as Page + capability widgets reading `activity` for that Page (open tasks, focus minutes this week, goal progress), configured with controlled selects.
**Likely files:** `DashboardBuilder.jsx`, `Dashboard.jsx`, `modules/dashboard.js`.
**Dependencies:** FOS-006, FOS-007, FOS-008.

### FOS-013 — Mobile Dashboard widgets are probably clipped to one row
**Area:** Mobile / dashboard · **Type:** F · **Priority:** High · **Confidence:** Medium
**Problem:** below 768 px the CSS sets `grid-row: auto !important` and `min-height: 84px !important`, while the grid keeps inline `grid-auto-rows: 84px` and each item has `overflow: hidden`. By the cascade, each widget occupies one 84 px row and clips its content.
**Evidence:** `DraggableDashboardGrid.jsx` (`<style>` block and inline styles). **Not rendered in a browser.**
**Why it matters:** if confirmed, the Dashboard is largely unusable on phones.
**Recommended change:** first, check at 375 px with Deadlines, Reminders and a chart widget. If confirmed, use `grid-auto-rows: minmax(84px, auto)` and `overflow: visible/auto` on mobile.
**Likely files:** `DraggableDashboardGrid.jsx`.
**Dependencies:** none.

### Medium

### FOS-014 — "Delete now" is incomplete and purge depends on the browser's clock
**Area:** Data lifecycle · **Type:** A/E · **Priority:** Medium · **Confidence:** High
**Problem:** permanent delete removes the Page documents plus `activity` and `nodes` documents, but not the subcollections under nodes (`values`, `activity`) because Firestore does not cascade. The 30-day purge runs only in the browser at app load, comparing `Date.now()` with `trashedAt`; a device whose clock is far ahead could purge early. Settings copy says cleanup happens "when Settings is opened" although `App.jsx` also runs it at every sign-in.
**Evidence:** `pages.js` (`deletePageRelatedDocs`, `purgeExpiredTrash`); `SettingsHub.jsx` copy.
**Why it matters:** deletion that is not complete or not reliably timed undermines trust in the Trash lifecycle.
**Recommended change:** delete subcollections explicitly (or retire nodes — FOS-028); store a `purgeAfter` and compare with server time or use a scheduled function; correct the copy; test.
**Likely files:** `data/pages.js`, `SettingsHub.jsx`, `App.jsx`.
**Dependencies:** FOS-001.

### FOS-015 — Trashed or archived Pages still feed Dashboard numbers
**Area:** Dashboard / data · **Type:** A · **Priority:** Medium · **Confidence:** High
**Problem:** Dashboard analysis, Tasks and Notes cards use all activity records regardless of Page status.
**Evidence:** `Dashboard.jsx` reads the full activity set with no Page-status filter.
**Why it matters:** "removing" a Page does not remove its influence on totals.
**Recommended change:** restrict to active Pages (join on active Page ids, or flag at trash time).
**Likely files:** `Dashboard.jsx`, `domain/insights.js`.
**Dependencies:** FOS-007.

### FOS-016 — Calendar is isolated from Pages and ignores preferences
**Area:** Calendar · **Type:** B/C · **Priority:** Medium · **Confidence:** High
**Problem:** only legacy `reminders` appear. Task due dates, goals and routines do not (the PRD asks for node-linked events). `weekStartsOn`, locale (hard-coded `en-IN`, Sunday-first `WEEKDAYS`), primary calendar and time format are ignored; the selected view and calendar system are not remembered. Persian/Hebrew/Buddhist are only labels on a Gregorian grid. The Year view counts only each reminder's *next* occurrence. Reminders have a time but nothing notifies.
**Evidence:** `Calendar.jsx` (no `preferences`/`weekStartsOn` references; local `useState("gregorian")`; year view uses `nextOccurrence`); no Notification/service-worker code in `src`. Views (Day/Week/Month/Agenda/Year) and a Today control do exist.
**Why it matters:** Calendar is a fixed system area that should reflect the user's configuration and their Pages.
**Recommended change:** read preferences; persist the last view; add Page-linked events through a shared schedule contract (FOS-035); either build real grids for other calendars (via `Intl`) or label them "date labels"; expand recurring items per month in the Year view.
**Likely files:** `Calendar.jsx`, `lib/reminders.js`, `lib/preferences.js`.
**Dependencies:** FOS-003, FOS-035.

### FOS-017 — Accessibility and language preferences are no-ops
**Area:** Settings / accessibility · **Type:** B · **Priority:** Medium · **Confidence:** High
**Problem:** UI scale, density, high contrast, reduced motion and large targets only set a class or data attribute; no CSS or code reads them. "Language" sets `lang`/`dir` only: there is no translation layer, so Urdu/Arabic flip the layout to RTL while the text stays English.
**Evidence:** `preferences.js` `applyPreferencesToDocument`; searching `src` finds no consumers apart from the `prefers-reduced-motion` media query in `index.css`.
**Why it matters:** controls that promise accessibility but change nothing erode trust.
**Recommended change:** implement them (CSS variables for scale/density/targets, a high-contrast token set, honour the reduced-motion class) or remove the controls until they work; label language as "direction only" or add i18n.
**Likely files:** `index.css`, `tailwind.config.js`, `preferences.js`, `SystemPreferences.jsx`.
**Dependencies:** owner decision.

### FOS-018 — Hijri dates use a tabular method and the adjustment control is orphaned
**Area:** Calendar / dates · **Type:** A/F · **Priority:** Medium · **Confidence:** High (method) / unverifiable (local sighting)
**Problem:** `toHijri` agrees exactly with `Intl` `islamic-civil` but differs from `islamic-umalqura` by one to two days on all five sample dates (2026-10-03: app 20/4/1448; Umm al-Qura 22/4/1448). The ±2-day adjustment is editable only on the orphaned page, and the UI shows "AH" without saying the date is approximate.
**Evidence:** an experiment comparing `lib/hijri.js` with `Intl`; `hijriAdjustmentDays` is edited only in `Settings.jsx`.
**Why it matters:** the Hijri date is shown prominently in the Dashboard header and Calendar.
**Recommended change:** owner decision on method (Umm al-Qura via `Intl`, tabular + adjustment, or manual sighting); expose the adjustment in Settings Hub; say which method is used.
**Likely files:** `lib/hijri.js`, `SystemPreferences.jsx`, `Calendar.jsx`, `Dashboard.jsx`.
**Dependencies:** FOS-006.

### FOS-019 — Goal and analysis semantics are wrong in several places
**Area:** Dashboard / Goals · **Type:** A · **Priority:** Medium · **Confidence:** High
**Problem:** Goals store a `period` (daily/weekly/monthly) but progress sums all entries ever; "Log" with an empty field records 0. On the Dashboard, KPI, Progress, Pie, Donut and ProgressChart show only the *latest day* of a configured 7/14/30-day range; Pie/Donut/ProgressChart clamp to 0–100 and add "%" even for minutes or counts; the "Pie chart" is a single ratio, not parts of a whole.
**Evidence:** `PageCapabilityRuntime.jsx` `Goals.current`; `Dashboard.jsx` `analysisValue = series.at(-1)` and the chart renderers.
**Why it matters:** numbers on the home screen mean something other than what their labels say.
**Recommended change:** define per-widget metric semantics (aggregate vs latest) and units; make pie/donut show real categories (e.g. minutes by capability or Page); window goal progress by period; guard empty input.
**Likely files:** `PageCapabilityRuntime.jsx`, `Dashboard.jsx`, `modules/dashboard.js`.
**Dependencies:** FOS-008.

### FOS-020 — Page "fields" behave like daily entries, not Page information
**Area:** Pages / fields · **Type:** A/C · **Priority:** Medium · **Confidence:** High
**Problem:** field values are saved under `values.{today}` and the Overview loads only today's map, so every field looks empty each new day. Each Save also writes a `field_snapshot` History record containing a full copy of the values (duplicate storage). "Required" is displayed but not enforced.
**Evidence:** `UserPage.jsx` (`setValues(page.values?.[todayKey()])`, `saveFields`); `pages.js` `setPageValues`.
**Why it matters:** unclear whether fields are static properties or daily metrics, and users will lose track of what they saved.
**Recommended change:** owner decision — static Page properties (one value, change history) or dated entries (date picker plus history view); store once; enforce required fields.
**Likely files:** `UserPage.jsx`, `data/pages.js`, `NodeFieldBuilder.jsx`, `NodeFieldValueEditor.jsx`.
**Dependencies:** FOS-003.

### FOS-021 — History is mutable, unfiltered and capped
**Area:** Page runtime / history · **Type:** B/C · **Priority:** Medium · **Confidence:** High
**Problem:** any record can be deleted, including definitions (habits, goals, routines, tasks), which orphans their check-ins and progress entries. There is no filter by capability/type/date, no pagination, no export, raw key labels, and a 500-record cap. The generic confirm says only "Delete this history record?".
**Evidence:** `UserPage.jsx` history view; `capabilityActivity.js` `deleteCapabilityActivity`.
**Why it matters:** PRD 5.2 expects append-oriented, recoverable, inspectable history.
**Recommended change:** separate definitions from events; soft-delete with undo; archive definitions instead of deleting; filters, pagination and CSV/JSON export; human labels from the registry.
**Likely files:** `UserPage.jsx` (extract a History view), `capabilityActivity.js`.
**Dependencies:** FOS-007, FOS-036.

### FOS-022 — Capability runtimes lack basic CRUD, undo, and states
**Area:** Page runtime · **Type:** B/C · **Priority:** Medium · **Confidence:** High
**Problem:**
- Tasks: completed tasks disappear (no list, no undo); no edit/delete; the `view` option (list/board/calendar) is ignored; subtasks are only a "↳" prefix; completing twice can create duplicate recurrences.
- Habits: no undo for a mistaken check-in; weekly/monthly habits show a day-streak ("3d").
- Routines: "Complete" logs a run with no per-step checklist.
- Notes: create-only; shows five.
- Workouts: one exercise per entry; no sessions, templates or personal records.
- Measurements: no trend or target.
- Time Tracking: no entry list or edit.
- Trackers: targets shown but progress not computed; latest five only.
- Custom capabilities: every field renders as a text input (types ignored); no record list.
- Writes have no error handling, saving state or feedback.
**Evidence:** the capability functions in `PageCapabilityRuntime.jsx`.
**Why it matters:** each capability must feel complete inside a Page, not like a demo.
**Recommended change:** complete the CRUD loop, empty/loading/error states and undo per capability; share one small activity hook and write helper (with error toasts); implement or remove unused config options.
**Likely files:** split `PageCapabilityRuntime.jsx` into `src/capabilities/*`.
**Dependencies:** FOS-005, FOS-007, FOS-030.

### FOS-023 — Page Builder form bugs and rough edges
**Area:** Pages / Page Builder · **Type:** A/C · **Priority:** Medium · **Confidence:** High
**Problem:** (a) the *new-Page* "Parent" dropdown excludes the currently selected Page and its descendants (logic copied from the edit form), so you cannot create a child under the selected Page without selecting another first or reparenting afterwards; (b) draft state is rebuilt from the snapshot whenever any Page changes, so unsaved edits can be overwritten, and switching Pages discards edits without warning; (c) "Sidebar order" is a bare number (new Pages all default to 0, so they sort alphabetically); there is no drag reorder and no Dashboard order; (d) name, parent, colour and description controls have no labels; (e) the icon list is duplicated; (f) trackers can be defined without the Tracking capability and then never appear; (g) new Pages are created with `showInNavigation: true`, contradicting the PRD ("Creating a Page does not automatically make it a sidebar item"), while `normalizePageConfig` defaults to `false`.
**Evidence:** `Workspace.jsx`; `data/pages.js` (`EMPTY_PAGE_CONFIG` vs `normalizePageConfig`).
**Why it matters:** this is the central builder screen of the product.
**Recommended change:** fix the filter; track dirty state with a guard; add drag reorder (fractional `order`); label all controls; extract an icon picker; tie trackers to the capability; honour the PRD default (owner decision).
**Likely files:** `Workspace.jsx`, `data/pages.js`.
**Dependencies:** FOS-009.

### FOS-026 — Navigation gaps
**Area:** Navigation · **Type:** A/C · **Priority:** Medium · **Confidence:** High
**Problem:** the collapsed sidebar renders no child Pages; sidebar search filters level by level, so a matching child under a non-matching parent is hidden; the mobile bottom bar has no active state and no Pages shortcut; a trashed or archived Page opened by URL still renders and accepts data; an unknown capability tab silently falls back to Overview; "New Page" only navigates to `/workspace` rather than focusing the create form.
**Evidence:** `Sidebar.jsx`; `UserPage.jsx` (no archived/trashed check).
**Why it matters:** hierarchy is a core concept; navigation should expose it everywhere.
**Recommended change:** flatten search results with breadcrumbs; show an indicator and flyout for children when collapsed; style the active tab on mobile; show a banner (and read-only mode) for trashed/archived Pages.
**Likely files:** `Sidebar.jsx`, `UserPage.jsx`.
**Dependencies:** FOS-001.

### FOS-027 — Accessibility remediation
**Area:** Accessibility · **Type:** C/A · **Priority:** Medium · **Confidence:** High (measured/counted); screen-reader behaviour **F**
**Problem:** see Section G — low-contrast helper text (measured 2.35–3.65:1), faint input borders (1.22:1), placeholder-only fields, unnamed icon buttons, removed focus rings, a focus-leaking mobile drawer, unlabeled landmarks, constant document title, unannounced status messages, and charts without text alternatives.
**Evidence:** contrast calculations from `tailwind.config.js`; counts from `src`.
**Why it matters:** usability for everyone, and the PRD lists accessibility as a requirement.
**Recommended change:** raise helper-text colour to at least 4.5:1 and input borders to 3:1; add labels and `aria-label`s; keep the global focus ring (don't use `outline-none` without a replacement); make the drawer a proper dialog (`inert` or `aria-hidden` when closed, focus trap, Escape); `aria-live` for save and error messages; per-route titles; text summaries for charts.
**Likely files:** `tailwind.config.js`, `index.css`, `Sidebar.jsx`, `Layout.jsx`, all forms, `Dashboard.jsx`.
**Dependencies:** FOS-017.

### FOS-028 — Legacy and dead code
**Area:** Codebase · **Type:** E · **Priority:** Medium · **Confidence:** High
**Problem:** 399 lines never routed or imported (`Tasks.jsx`, `Academics.jsx`, `ProgressRing.jsx`); `registry.js` `MODULES`/`isModuleEnabled` unused (and it names a `/tasks` route that does not exist); the drag/resize path in `DraggableDashboardGrid` is never enabled; `archivePage` is used only on the orphaned page; `migrateAcademicsToStudy_DISABLED_DO_NOT_CALL` remains; legacy routes (`/study`, `/pomodoro`, `/exercise`, `/habits`, `/timetables`) are live but unlinked.
**Evidence:** import/route searches in `src`; `App.jsx`.
**Why it matters:** about 36 % of source lines are legacy, orphaned or dead, which obscures the real product and invites regressions.
**Recommended change:** an owner-approved removal plan once migration is verified: delete dead files; keep the legacy data layer read-only for import; retire legacy routes; update or delete the registry.
**Likely files:** `App.jsx`, `modules/registry.js`, `pages/*` legacy files, `lib/data.js`, `lib/study.js`, `lib/timetable.js`.
**Dependencies:** FOS-008, owner decision.

### FOS-029 — Duplicated implementations
**Area:** Codebase · **Type:** E · **Priority:** Medium · **Confidence:** High
**Problem:** two Page editors (`Settings.jsx`, `Workspace.jsx`) with different feature sets; `USER_CAPABILITY_PREFIX`/`isUserCapabilityKey` defined in both `modules/capabilities.js` and `data/userCapabilities.js`; streak and date logic implemented three times.
**Evidence:** the files named above; `lib/dates.js` `currentStreak`; the Habits capability.
**Why it matters:** fixes land in one copy and not the other (FOS-009 and FOS-023 are examples).
**Recommended change:** one Page editor; one capability-key module; one date/streak domain module.
**Likely files:** as above.
**Dependencies:** FOS-006, FOS-003.

### FOS-030 — Business logic in components; thin tests; no CI
**Area:** Architecture / quality · **Type:** E · **Priority:** Medium · **Confidence:** High
**Problem:** recurrence, streaks, goal progress and analytics bucketing live inside React components that also write to Firestore (contrary to `architecture.md`), so they cannot be unit-tested. Of the three Node test scripts, `test-nodeValidation.mjs` has one failing assertion ("exactly one MODULES entry is currently node-backed": expected `["study"]`, actual `[]`). There are no tests for `pages.js`, activity, preferences, dates, dashboard normalization or Firestore rules; `package.json` has no `test` script; there is no CI. Lint: 0 errors, 15 warnings (12 × `set-state-in-effect`, 1 impure render call in `SettingsHub`, 1 fast-refresh, 1 unused import).
**Evidence:** test run and lint run output; file inspection.
**Why it matters:** the fixes in this backlog (dates, recurrence, trash) need regression tests to stay fixed.
**Recommended change:** extract `src/domain/{tasks,habits,goals,focus,insights,dates}.js`; fix or remove the stale assertion; add emulator-based rules tests; add `npm test` and a GitHub Action running lint, test and build.
**Likely files:** new `src/domain/*`, `scripts/*`, `package.json`, `.github/workflows/ci.yml`.
**Dependencies:** none (do early).

### FOS-031 — Listener sprawl and missing error handling
**Area:** Data layer · **Type:** E/A · **Priority:** Medium · **Confidence:** High
**Problem:** the Dashboard opens 13 listeners (≈16 live on that route); the Pages query is subscribed up to three times on the Page Builder; `subscribeNodes` loads all nodes then filters by `pageId`; config is read twice (`getConfig` + `subscribeConfig`). No `onSnapshot` has an error callback, so permission or network failures leave screens on "Loading…" indefinitely; most write handlers have no try/catch or user feedback; `purgeExpiredTrash` re-reads all Pages on every app load.
**Evidence:** `subscribe*` call counts per file; `subscribePage`/`subscribePages` signatures.
**Why it matters:** cost, jank, and silent failure.
**Recommended change:** app-level providers (Pages, Config, Profile) with one listener each; error callbacks surfaced in UI; a global error boundary and toast layer.
**Likely files:** `App.jsx`, `Sidebar.jsx`, `Dashboard.jsx`, `UserPage.jsx`, `Workspace.jsx`, `data/*`.
**Dependencies:** FOS-002.

### FOS-032 — Documentation has drifted from the code
**Area:** Docs · **Type:** E · **Priority:** Medium · **Confidence:** High
**Problem:** `PROJECT_STATUS.md` was last updated 2026-09-03 and `CHANGELOG.md` stops at 2026-10-02, but main has about 30 newer commits; its Known Issues and Next Task lists are stale (it still plans to rebuild Study on nodes and names a different GitHub repository). `README.md` lists "Namaz/prayer tracking" as a current capability — only data-layer code exists, no UI. `tasks.md` marks the Dashboard Builder and Page-bound widgets as done though they are unreachable or stubbed. The PRD has three sections numbered 4, contradicts itself on Node vs Page, says Pages are created through Settings (the product uses `/workspace`), and says new Pages should not auto-appear in navigation (the code does the opposite).
**Evidence:** the documents themselves, compared with the code.
**Why it matters:** the documents are the project's source of truth and are used to brief future sessions.
**Recommended change:** after the owner decisions below, reconcile the PRD (single numbering, one Node/Page definition, sidebar default), refresh status/changelog, correct README claims, and record decisions as short ADRs.
**Likely files:** `prd.md`, `architecture.md`, `tasks.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`.
**Dependencies:** owner decisions.

### Low

### FOS-024 — A literal "\n" is rendered in the Tools area
**Area:** Page runtime · **Type:** A · **Priority:** Low (trivial fix) · **Confidence:** High
**Problem:** a stray backslash-n sits between the Notes and Tracking lines and renders as visible text on every capability tab.
**Evidence:** `PageCapabilityRuntime.jsx:168` (raw bytes `}\n    {has("tracking")`); the compiled chunk contains the string child `"\\n    "`.
**Why it matters:** a visible glitch in the main runtime.
**Recommended change:** remove the stray characters; add a test or lint rule for literal `\n` in JSX.
**Likely files:** `src/components/PageCapabilityRuntime.jsx`.
**Dependencies:** none.

### FOS-025 — Naming, breadcrumb and dialog consistency
**Area:** UX / copy · **Type:** C · **Priority:** Low · **Confidence:** High
**Problem:** the breadcrumb falls back to "FocusOS" and reads "FocusOS › FocusOS" on `/page/:id`, `/workspace/node/:id` and `/settings/legacy`. Terms collide: "Pages" (nav) vs "Workspace / Page Builder" (screen) vs "Node / Item / Sub-page", and "Focus OS" (login) vs "FocusOS". Three native `window.confirm` boxes; "Sign out" uses an ✕ icon.
**Evidence:** `Layout.jsx` `PAGE_LABELS`; `Login.jsx`; `ProfileSetup.jsx`; `Workspace.jsx`; `UserPage.jsx`; `Sidebar.jsx`.
**Why it matters:** the vocabulary is the product's mental model.
**Recommended change:** agree a glossary; dynamic breadcrumbs with the Page name; styled confirm dialog; proper sign-out icon.
**Likely files:** `Layout.jsx`, `Sidebar.jsx`, `Login.jsx`, `Workspace.jsx`, `UserPage.jsx`.
**Dependencies:** owner decision on terminology.

### FOS-033 — Security and dependency notes
**Area:** Security · **Type:** E/F · **Priority:** Low–Medium · **Confidence:** Medium
**Problem:** Firestore rules are correctly owner-only but accept any shape and size, and there are no rules tests. `npm audit --omit=dev` reports four high advisories via `@grpc/grpc-js` inside `firebase`; they concern gRPC server behaviour and most likely do not apply to the browser bundle, and npm's suggested fix would downgrade to `firebase@9.14.0`. The login screen has no password reset. I could not verify whether Firebase email/password self-sign-up is enabled, whether App Check is on, or that the deployed rules equal the repository rules.
**Evidence:** `firestore.rules`; audit output; `Login.jsx`.
**Why it matters:** low risk for a single-user app, but cheap to harden.
**Recommended change:** add shape/size validation in rules plus emulator tests; confirm in the Firebase console that sign-up is disabled and deployed rules match; keep Firebase current rather than downgrading; consider a password-reset link.
**Likely files:** `firestore.rules`, new rules tests, Firebase console.
**Dependencies:** FOS-030.

### FOS-034 — Load performance
**Area:** Performance · **Type:** E · **Priority:** Low · **Confidence:** Medium
**Problem:** about 243 kB gzip of JavaScript before the first route chunk (main 79 kB + Firebase 164 kB; Vite warns about the 555 kB chunk); fonts load through a render-blocking CSS `@import` from Google Fonts; the Dashboard rebuilds all widget closures on every render.
**Evidence:** build output; `index.css`; `Dashboard.jsx`.
**Why it matters:** modest today; grows with FOS-007's reads.
**Recommended change:** self-host or preload fonts with `font-display: swap`; split the widget renderers into memoized components; revisit bundle splitting after the data-layer work.
**Likely files:** `index.css`, `index.html`, `Dashboard.jsx`, `vite.config.js`.
**Dependencies:** FOS-007.

### Product suggestions (D)

### FOS-035 — A shared Target / Schedule / Insights contract
**Area:** Product architecture · **Type:** D · **Priority:** Medium · **Confidence:** Medium
**Problem:** the Activity → Target → Schedule → History → Insights chain is only partly built (see Section A). Targets, schedules and insights are each implemented separately per capability or per legacy screen.
**Evidence:** Goals entries, tracker `target` text and Dashboard "Progress" target; reminders, timetables, task due dates and habit cadence; broken Page Analytics.
**Why it matters:** this is what turns a set of capabilities into one operating system.
**Recommended change:** define a small contract — `targetId`, `scheduleId`/due date, `sourceRef` on activity — so a Goal can target any metric, schedules feed Calendar and Dashboard, and Insights are computed from the stream. Needs the owner's approval before any build.
**Likely files:** new `src/domain/*`, `data/capabilityActivity.js`, `modules/capabilities.js`, `Calendar.jsx`, `Dashboard.jsx`.
**Dependencies:** FOS-003, FOS-007, FOS-008, owner decision.

### FOS-036 — Export and backup
**Area:** Data ownership · **Type:** D · **Priority:** Medium · **Confidence:** High
**Problem:** there is no way to export Pages, activity or configuration, yet the PRD asks for exportable, inspectable raw records and the product has destructive operations.
**Evidence:** no export code in `src`; PRD §5.2.
**Why it matters:** data ownership is part of a personal operating system's trust.
**Recommended change:** JSON (full) and CSV (activity) export from Settings; optionally a JSON import for restore.
**Likely files:** new `src/data/export.js`, `SettingsHub.jsx`.
**Dependencies:** FOS-007, FOS-021.

### FOS-037 — Customize mode and drag-reorder
**Area:** Dashboard / navigation · **Type:** D · **Priority:** Medium · **Confidence:** Medium
**Problem:** widget placement is typed into number boxes and Page order is a number field, although a drag/resize grid already exists in the codebase.
**Evidence:** `DraggableDashboardGrid.jsx` (only used with `editable={false}`); `DashboardBuilder.jsx`.
**Why it matters:** PRD asks for move, resize and reorder; direct manipulation is the expected way.
**Recommended change:** a "Customize" mode on the Dashboard that turns on the existing grid, with keyboard-accessible move/resize controls and a save/cancel bar; drag reorder for the sidebar tree.
**Likely files:** `Dashboard.jsx`, `DraggableDashboardGrid.jsx`, `Sidebar.jsx`.
**Dependencies:** FOS-006, FOS-013.

### FOS-038 — Optional Page presets
**Area:** Onboarding / pages · **Type:** D · **Priority:** Low · **Confidence:** Low
**Problem:** the blank-canvas start can be heavy for a new user.
**Evidence:** PRD §5.1 itself lists example compositions (e.g. "Study Page with Tasks + Focus + Time Tracking").
**Why it matters:** faster first value — but only if it cannot be mistaken for predefined life categories.
**Recommended change:** user-invoked presets after "Create Page" (never automatic, never fixed), editable like any Page. Only if the owner is comfortable with the trade-off.
**Likely files:** `Workspace.jsx`, new `src/modules/presets.js`.
**Dependencies:** FOS-010.

---

## Items I could not verify (type F)

- Anything in the **live application**: rendering, console errors, first paint, the real deployed build.
- **Mobile layout**, notably Dashboard clipping (FOS-013), Calendar at phone width, RTL.
- **Screen-reader** behaviour and Calendar keyboard navigation.
- **Firebase console state:** whether email/password sign-up is enabled; whether deployed rules match the repository; whether a leftover auto-created "B.Tech" study program exists in live data (the status document flags this as an open manual check); whether any composite indexes exist outside the repository.
- **Hijri accuracy** relative to local moon sighting (only the algorithm was checked).
- **Behaviour at scale:** read costs and latency with thousands of activity records (analysed statically only).
- Whether the `@grpc/grpc-js` advisories are reachable from the browser bundle (judged unlikely, not proven).

---

## NEXT ACTIONS — for the product owner to review before any implementation

**Decisions only you can make**
1. **One hierarchy or two?** Should "Nodes" (items inside Pages, `NodeDetail`, onboarding node, node widgets) be retired in favour of Pages only? This shapes FOS-001, 011, 012, 014, 028.
2. **Trash semantics for sub-Pages:** trash the whole subtree together, ask at trash time, or promote children to root? (FOS-001 — the only data-loss risk found.)
3. **Day semantics:** use the configured time zone for "today"? Add an optional "day starts at" hour? Agree not to rewrite existing records without consent. (FOS-003.)
4. **Where configuration lives:** Settings Hub sections, a Dashboard "Customize" mode, or both; and confirm that Dashboard Builder, custom capabilities, display name, Hijri adjustment and Archive are meant to be reachable. (FOS-006, 037.)
5. **Legacy retirement plan:** keep legacy screens until migration is verified, then remove? Should Dashboard widgets switch fully to the activity stream? (FOS-008, 028.)
6. **Capability catalog:** hide or remove runtime-less capabilities and legacy aliases; resolve overlap between Tracking, Measurements, trackers and Goals; name "Focus Sessions". (FOS-010.)
7. **Target / Schedule / Insights contract:** approve the shape before any build. (FOS-035.)
8. **History rules:** immutable, soft-delete with undo, or free deletion? (FOS-021.)
9. **Page "fields":** static Page properties or dated daily entries? (FOS-020.)
10. **Hijri method:** Umm al-Qura, tabular with adjustment, or manual sighting; say which one is shown. (FOS-018.)
11. **New Pages in the sidebar by default?** The PRD says no; the code says yes. (FOS-023.)
12. **Accessibility and language preferences:** implement them or remove the controls until they work. (FOS-017.)
13. **Glossary:** Page, Workspace, Page Builder, Node, Item, Sub-page, FocusOS vs Focus OS. (FOS-025.)

**Low-risk work that could start as soon as you approve** (no product decision needed)
- Verify the mobile Dashboard clipping in a 375 px viewport (FOS-013); verify `/settings/legacy` is also unlinked on the live build (FOS-006).
- Add validation and an error boundary (FOS-002); fix the Configure link (FOS-009); remove the stray "\n" (FOS-024); fix the new-Page parent filter (FOS-023a).
- Fix Focus Pause and persist sessions (FOS-005); fix Analytics (FOS-004, after FOS-007).
- Add `npm test` and CI, repair the stale test, add date/trash/recurrence tests *before* the fixes (FOS-030).
- Check in the Firebase console that sign-up is disabled and that deployed rules match the repository (FOS-033).

*End of report.*
