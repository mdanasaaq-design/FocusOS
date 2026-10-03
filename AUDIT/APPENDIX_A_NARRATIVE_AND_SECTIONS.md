# FocusOS — Complete Product & Code Audit

**Audit date:** 2026-10-03 · **Repository:** `mdanasaaq-design/FocusOS`, branch `main` @ `07cd4e3` ("fix: close Sidebar function correctly"; 311 commits) · **Live app:** https://focusos-7cd08.web.app
**Scope:** audit only. Nothing in the repository was modified, committed or pushed (the audited clone shows 0 changed files; builds and tests ran in a separate throwaway copy).

---

## 0. Method, limits and how to read this report

**What I did**
- Read all of `src/` (7,401 lines), `firestore.rules`, `firebase.json`, and the product documents (PRD, architecture, rules, design, tasks, status, changelog, README).
- Ran in a scratch copy: `npm ci`, `oxlint` (0 errors, 15 warnings), the three Node test scripts (two pass; `test-nodeValidation` has one failing assertion), `vite build` (passes), `npm audit`.
- Wrote small experiments to confirm suspected defects: timezone simulation under `TZ=Asia/Kolkata`, `Intl` time-zone validation, a Hijri cross-check against `Intl` calendars, and WCAG contrast calculations from the Tailwind palette.

**What I could not do — please read this**
- **I could not use the live application.** It is a client-rendered single-page app behind Firebase email/password login. I could fetch only the HTML shell (title and viewport tag); I have no credentials, no browser, and my shell cannot reach `*.web.app`. So there was no clicking through, no screenshots, no real viewport tests, no console inspection.
- Every statement about runtime or visual behaviour is therefore derived from the code. Where I am inferring rendered behaviour (mainly CSS), I label it **F** and give a confidence level. The deployed build may also be older or newer than `main`.

**Type labels** (as requested)

| Label | Meaning |
|---|---|
| **A** | Confirmed bug (deterministic from the code, or reproduced in an experiment) |
| **B** | Confirmed missing functionality |
| **C** | UX improvement |
| **D** | Product suggestion |
| **E** | Technical debt |
| **F** | Could not verify |

Confidence: **High** = deterministic from code or reproduced; **Medium** = strong inference, not run in a browser; **Low** = plausible, needs checking.

---

## A. Current product understanding

**What FocusOS actually is today (from the code):** a single-user, dark-themed personal workspace built on React 19, Vite 8, Tailwind 3 and Firebase (email/password Auth, Firestore, Hosting). The navigation has three fixed destinations — Dashboard, Pages, Calendar — plus Settings and a tree of user-created Pages.

**The intended idea is visible and mostly sound:** a Page starts empty; the user attaches *capabilities* (Tasks, Focus, Time Tracking, Habits, Routines, Goals, Workouts, Measurements, Notes, Trackers, Analytics, plus user-defined ones); every capability writes into one shared `users/{uid}/activity` stream; a per-Page History tab reads it back.

**What the repository contains in reality is three generations layered on top of each other:**

| Generation | Where it lives | State |
|---|---|---|
| **1. Legacy specialist apps** | `/habits`, `/pomodoro`, `/exercise`, `/timetables`, `/study` routes; collections `habits`, `habitLogs`, `pomodoroSessions`, `exerciseLogs`, `weightLogs`, `timetables`, `reminders`, `deadlines`, `study*`; `lib/data.js` | Still routed (by URL only — no navigation links), still feeding the Dashboard and Calendar |
| **2. Generic Nodes** | `users/{uid}/nodes` (+ `values`, `activity` subcollections); `NodeDetail`, onboarding "first node", Page "items", node-bound dashboard widgets | A third hierarchy, parallel to Pages |
| **3. Pages + capabilities** | `users/{uid}/pages`, `users/{uid}/activity`, `UserPage`, `PageCapabilityRuntime`, `Workspace` (Page Builder) | The intended future; partially complete |

Roughly **2.7k of 7.4k source lines (36%)** are legacy screens, the legacy data layer, an orphaned settings page, or dead files.

**What a first-time user experiences (traced through the code):**
1. Login (no sign-up, no password reset — "account created in Firebase Console").
2. Four-step onboarding: name, greeting, clock/time zone, calendar/format, then an optional "first node".
3. Dashboard: greeting header with date and clock, then default widgets Clock, Date, **Deadlines** (no way to add one), Reminders, Pages (empty state).
4. Sidebar: Dashboard, Pages, Calendar, a "Create a Page to build your own workspace" hint, Settings.
5. "New Page" → Page Builder (`/workspace`): one long form for icon, name, parent, colour, description, fields, trackers, capabilities, capability config, visibility, then Save / Move to Trash.
6. Page runtime: Overview + one tab per capability + History.

**Does it follow the philosophy?** The *foundation* does: empty-by-default Pages, capability composition, one activity stream, configurable greeting/preferences. The *product as a whole* does not yet read as one operating system. The Activity → Target → Schedule → History → Insights chain is only half real:

| Link | State |
|---|---|
| Activity | ✔ Good shared record shape |
| History | ✔ exists, but mutable and capped at 500 records (FOS-021) |
| Target | ✗ Three unrelated mechanisms: Goals entries, tracker `target` text, Dashboard "Progress" target |
| Schedule | ✗ Calendar reminders, legacy timetables, task due dates and habit cadence share no model; none feed each other |
| Insights | ✗ Page Analytics is permanently empty (FOS-004); Dashboard analysis reads mostly legacy sources (FOS-008) |

---

## B. What is working well (preserve)

- **Security model:** per-user subtree with owner-only rules; `.env` never committed; no secrets in tracked files.
- **One activity envelope** (`capability / type / title / date / durationMinutes / value / unit / metadata`) written by every capability, and the principle that history survives when a capability is later disabled. This is the right backbone.
- **Empty-by-default Pages** and per-Page capability composition. It matches the philosophy and is implemented, not just documented.
- **Normalizer pattern** (defaults + validation) for page config, dashboard layouts and preferences. One gap (time zone, FOS-002), otherwise sound.
- **Legacy migration done correctly:** explicit, additive, copy-only, per-destination idempotency markers, no deletes; the auto-migration was disabled rather than deleted.
- **Archive vs Trash vs Delete-now** is a clear concept, with restore and a confirmation on permanent delete (the *cascade* is the problem, not the idea).
- **Pure domain modules with Node tests** (`nodeTree`, `progress`, `nodeValidation`): the right pattern to extend.
- **Dashboard model:** layout config separated from rendering; multiple layouts; widget duplication; analysis ranges 7/14/30.
- **Engineering hygiene:** route-level lazy loading; production build passes; lint has 0 errors; global `:focus-visible` ring; `prefers-reduced-motion` honoured; login form has proper labels; `lang`/`dir` are applied from preferences.
- **Sidebar:** collapsible with persisted state, nested Pages, search, mobile drawer and bottom bar.
- **Design system:** a consistent token set (ink / parchment / brass / teal / clay) and card styling.
- **Documentation culture:** PRD, architecture, rules and tasks exist and state the philosophy clearly (they have drifted — FOS-032 — but the habit is valuable).

---

## C. Critical bugs (functional / data-loss)

Details, evidence and fixes are in the backlog (Section K).

| # | Bug | Backlog |
|---|---|---|
| C1 | **Trashing a parent Page permanently destroys its un-trashed sub-Pages** (and their history) when the parent is purged or "Delete now" is used. The sidebar hides those children as soon as the parent is trashed, and neither confirmation mentions them. | FOS-001 |
| C2 | **An invalid time zone crashes the app.** Time zone/locale are free-text, unvalidated; `Intl` throws during Dashboard render; there is no error boundary, so the screen goes blank until the user types `/settings` in the URL. Reproduced: `RangeError: Invalid time zone specified: India`. | FOS-002 |
| C3 | **"Today" is the UTC date, not the user's day.** Records made 00:00–05:30 IST are filed under yesterday; daily recurring tasks regenerate with the *same* due date for UTC+ users. Reproduced under `TZ=Asia/Kolkata`. | FOS-003 |
| C4 | **Page Analytics always shows zeros** because it only receives records whose capability is "analytics". | FOS-004 |
| C5 | **Focus "Pause" resets the timer to full**, and a running session is lost if you leave the tab. | FOS-005 |

---

## D. Important problems (materially affect usability or product quality)

- **Dashboard Builder, custom-capability builder, display-name and Hijri-adjustment editing, and Page "Archive" are unreachable** — they live only on `/settings/legacy`, which nothing links to (FOS-006).
- **Cost and correctness of reads:** each Page tab downloads the *entire* activity collection twice; the "limit" silently truncates after download (FOS-007).
- **Split-brain data:** Dashboard Habits/Pomodoro/Exercise/Schedule read legacy collections while Page capabilities write elsewhere; two different "focus" totals can appear on one screen (FOS-008).
- **"Configure" on a Page opens the first Page's configuration**, not the current one (FOS-009).
- **Capabilities that do nothing:** seven built-ins (and Tracking without trackers) open empty tabs (FOS-010).
- **First-run is broken in small ways:** onboarding creates an invisible legacy node; the default Deadlines widget has no way to be filled; date and clock appear twice (FOS-011).
- **Page-bound dashboard widgets cannot be created** and the node widget is a placeholder (FOS-012).
- **Probable mobile Dashboard clipping** (F — verify first; FOS-013).
- Delete-now leaves orphaned data; purge is client-side and clock-dependent (FOS-014). Trashed Pages still feed Dashboard numbers (FOS-015).
- Calendar is isolated from Pages and ignores most preferences (FOS-016); accessibility preferences do nothing (FOS-017); Hijri dates default to a tabular method 1–2 days off Umm al-Qura (FOS-018).
- Goal/analysis semantics are wrong in several places (FOS-019); Page "fields" reset visually every day (FOS-020); History is mutable and un-exportable (FOS-021); runtime capabilities lack basic edit/delete/undo (FOS-022).
- Page Builder form bugs (FOS-023).

---

## E. UI/UX improvements

Items marked "→" are in the backlog; the rest are small and can be bundled.

- **Dashboard:** "Pie chart" shows one ratio, not parts of a whole; KPI says "Current value" regardless of the 7/14/30 range; progress/pie/donut clamp minute and count metrics to 100 and print "%" (→ FOS-019). The Builder shows a "Greeting" widget toggle that has no effect (→ FOS-011). Widget placement is edited with raw X / Y / Width / Height numbers; the drag-and-resize grid that exists is never enabled (→ FOS-037). The Builder reads node/capability selects with `document.getElementById` instead of controlled state.
- **Page runtime:** completed tasks vanish (no list, no undo); no in-place edit/delete; "Save" on Page information writes a History record every time; History shows raw keys such as `timeTracking · time_entry` (→ FOS-021/022). The overview tiles all say "Open X for this Page" — a one-line summary per capability (open tasks, minutes this week) would make the Overview useful.
- **Page Builder:** one very long form with no sections collapsed or navigable; icon list duplicated inline and mixes glyphs with emoji; "Sidebar order" is a bare number (→ FOS-023).
- **Navigation / naming:** "Pages" (nav) vs "Workspace / Page Builder" (screen) vs "Node / Item / Sub-page" vs "Focus OS" (login) vs "FocusOS"; breadcrumb reads "FocusOS › FocusOS" on Page routes; "Sign out" uses an ✕ icon; three native `window.confirm` boxes (→ FOS-025/026).
- **Settings:** language, locale and time zone are free-text where a validated picker belongs; Trash copy says cleanup runs "when Settings is opened" though it also runs at every sign-in (→ FOS-002/014).
- **Calendar:** view and calendar-system are not remembered; Persian/Hebrew/Buddhist are labels on a Gregorian grid, not real grids (→ FOS-016).

---

## F. Mobile / responsive issues

Static analysis only — none of this was rendered.

1. **(F, Medium) Dashboard widgets may be clipped to one 84 px row below 768 px.** The container keeps inline `grid-auto-rows: 84px`; the mobile stylesheet sets `grid-row: auto !important` and `min-height: 84px !important` (which also overrides each widget's inline `min-height`); each item has `overflow: hidden`. By the CSS rules, a Deadlines list or chart would be cut off. **Check this first** on a 375 px viewport (FOS-013).
2. **Double padding:** `Workspace`, `Settings` and `SettingsHub` use `p-8` inside a layout that already has `px-4`, leaving ≈279 px of content width on a 375 px phone.
3. **Mobile bottom bar has no active state** (static class names on `NavLink`) and no route to a Page except through the hamburger drawer.
4. **Tiny text:** 30 uses of 8–10 px text, plus 63 uses of 11 px (chart labels, hints, history metadata).
5. **Collapsed desktop sidebar** renders only top-level Pages; children cannot be reached from it.
6. **Small controls:** many builder buttons are `px-2 py-1`; checkboxes are 16 px; the "Large targets" preference is a no-op (FOS-017).
7. **Not verified:** Calendar month grid at phone width, Page Builder tracker rows, RTL layout (Urdu/Arabic flips direction while the layout uses non-logical `ml-/mr-/border-r` classes).

---

## G. Accessibility issues

1. **Contrast (measured, not guessed).** Helper text uses `text-parchment-300` at 35–60 % opacity in **120 places**. On the card background that is 2.96:1 at 50 % and 2.35:1 at 40 % (AA needs 4.5:1); even 60 % is only 3.65:1. Input borders (`ink-600` on `ink-700`) are 1.22:1, so field boundaries are very faint (WCAG 1.4.11 asks for 3:1).
2. **Labels:** about 205 form controls versus 97 `<label>` elements and 17 `aria-label`s (rough static count). Placeholder-only fields include the Page name/parent/colour/description, every capability form (Tasks, Habits, Goals, Workouts, Notes…), and the sidebar search.
3. **Icon-only buttons without names:** tracker ✕, Builder ↑ ↓, sub-item "+", sign-out ✕.
4. **Focus indicator removed:** 64 elements use `outline-none` and rely on a border colour change that is only faintly visible.
5. **Mobile drawer:** off-canvas links stay in the tab order (it is only translated away); no `aria-modal`, focus trap, Escape handling, or focus return.
6. **Structure:** two unlabeled `<nav>` landmarks plus the Page tab strip; constant `document.title` ("FocusOS") on every route; no skip link; heading levels differ per screen (Workspace/Settings start at `h2`).
7. **Status messages** ("Saved ✓", errors) are not announced — only one `aria-live`/`role` attribute exists in the whole app.
8. **Charts:** conic-gradient pies, SVG lines and heatmaps have no text alternative; heatmap values are in `title` only.
9. **Preferences that promise accessibility but do nothing:** UI scale, density, high contrast, reduced motion, large targets (FOS-017).
10. **Not verified:** screen-reader behaviour, Calendar keyboard navigation.

---

## H. Architecture / technical debt

- **Two (really three) hierarchies:** Pages and Nodes coexist; Page "items" are Nodes; `NodeDetail` is a second detail surface. The PRD itself is contradictory (it says both "FocusOS presents user-created Nodes as Pages" and "A Page is not a renamed Node") and has three sections numbered 4.
- **Legacy and dead code:** `Tasks.jsx`, `Academics.jsx` and `ProgressRing.jsx` (399 lines) are never routed or imported; `registry.js` `MODULES` has no consumers (and lists a `/tasks` route that does not exist); drag/resize code in `DraggableDashboardGrid` is never enabled; legacy routes are live but unlinked (FOS-028).
- **Duplication:** two full Page editors (`Settings.jsx`, `Workspace.jsx`) that have diverged; `USER_CAPABILITY_PREFIX` defined in two files; streak/date logic in three places (FOS-029).
- **Layering violated:** recurrence, streaks, goal progress and analytics bucketing live inside React components that also write to Firestore, contrary to `architecture.md`; therefore untestable (FOS-030).
- **Persistence boundary inconsistent:** `addCapabilityActivity` normalizes; `updateCapabilityActivity` writes raw patches; `updatePage` silently drops unknown config keys; the Firestore rules accept any shape.
- **Naming collisions:** two different things are called `activity` (`users/{uid}/activity` for capabilities, `users/{uid}/nodes/{id}/activity` for node audit); `StartCard.jsx` exports `StatCard`; `aos_sidebar_collapsed` is a leftover prefix.
- **Listener sprawl and error handling:** 13 listeners in `Dashboard.jsx` (≈16 live on that route); the same pages query subscribed up to three times on the Page Builder; no `onSnapshot` error callbacks, so a failed subscription leaves a screen on "Loading…" forever; no error boundary (FOS-031).
- **Side effect in a state updater** in the Focus timer (double-fires under StrictMode in development).
- **Tests/CI:** three plain Node scripts; one assertion is stale (expects a node-backed module that no longer exists); no `npm test`, no CI, no rules tests; 15 lint warnings (12 × `set-state-in-effect`, 1 impure render call, 1 fast-refresh, 1 unused import).
- **Dependencies:** `npm audit --omit=dev` reports 4 high advisories, all via `@grpc/grpc-js` inside `firebase`. They concern gRPC *server-side* behaviour and are most likely not reachable from the browser bundle; npm's suggested "fix" is a downgrade to `firebase@9.14.0`, which should **not** be applied (FOS-033, type F).
- **Performance:** ≈243 kB gzip of JavaScript before the first route chunk (main 79 kB + Firebase 164 kB); Google Fonts loaded through a render-blocking CSS `@import`; the Dashboard rebuilds ~25 widget closures every render (FOS-034).

---

## I. Product gaps (only those that fit the philosophy)

1. **A shared Target / Schedule / Insights contract** so the chain is real: let a Goal target any metric (focus minutes, a tracker, a measurement), let tasks/routines/timetables produce scheduled items that Calendar and Dashboard both read, and compute Insights from `activity` (FOS-035).
2. **Export / backup** of Pages, activity and config. The PRD requires "exportable/inspectable raw records", and the system has destructive operations and a single storage location (FOS-036).
3. **Edit-in-place Dashboard and drag-reorder** for navigation and widgets — the grid code already exists; it needs a "Customize" mode and keyboard-accessible move controls (FOS-037).
4. **Day-boundary and time-zone semantics** configurable by the user (including an optional "day starts at" hour). Folded into FOS-003.
5. **Page-linked events on the Calendar** (the PRD's "node-linked events") — folded into FOS-016.
6. **Soft-delete/undo for activity records** (PRD 5.2 "recovery-safe") — folded into FOS-021.
7. **Opt-in Page presets** (e.g. "Tasks + Focus + Time Tracking") that a user *chooses*, to soften the blank-canvas start — only if the owner is comfortable that it does not reintroduce predefined categories (FOS-038).

Deliberately **not** suggested: gamification, social features, fixed prayer/fitness/study modules, AI features (Awwab is out of scope), billing.

---

## J. Things we should not change

- The owner-only Firestore rule structure (`users/{uid}/**`).
- The unified activity envelope and "history persists after a capability is disabled".
- Pages being empty by default; capabilities as the only way behaviour is added.
- Normalizers with defaults for config, dashboards and preferences.
- Explicit, additive, idempotent legacy migration — never silent, never destructive.
- The Archive / Trash / Restore / Delete-now vocabulary and the explicit permanent-delete confirmation (fix the cascade, keep the model).
- Pure domain modules plus plain Node tests; extend this approach rather than replacing it.
- Lazy-loaded routes, the dark design tokens, the global focus ring, reduced-motion handling, `lang`/`dir` application.
- Dashboard layout config kept separate from the renderer; multiple layouts; configurable greeting prefix and time messages.
- **No fixed specialist modules** (prayer, exercise, study, Pomodoro). Keep them as capabilities; resist re-adding sidebar entries for them.

