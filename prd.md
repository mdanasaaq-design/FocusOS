# FocusOS — Product Requirements Document

## 1. Product Vision

FocusOS is a configurable personal operating system. It provides the tools, while the user builds their own system according to their needs, structure, workflows, and preferences.

> FocusOS provides the tools; the user builds their own FocusOS.

FocusOS is designed for a single owner initially. The long-term direction may include Awwab, an intelligent assistant layer, but Awwab is not part of the current foundation scope.

## 2. Product Principles

- The user defines their own structure and workflows.
- FocusOS must not assume a student identity, profession, or lifestyle.
- Users must not be forced into predefined life categories.
- User-created workspaces use the Page model; general-purpose organizational entities use the Node model. These concepts and hierarchies are distinct.
- Pages and Nodes support nested parent-child relationships within their own hierarchies.
- Tools provide reusable functionality. Nodes may support capabilities where useful, while Pages place configured views and specialist records retain domain-appropriate data models.
- Views present information; they do not define or duplicate the underlying domain records.
- Meaningful user data and history must persist reliably.
- Existing data must not be deleted or transformed destructively without explicit consent.
- Major behavior should be configurable where practical.
- Implementation status must be evidence-based; an intended requirement is not proof that the feature is complete.

## 3. Core Concepts

### 3.1 Page

A **Page** is a configurable workspace and user-facing application area. It is a distinct domain concept, not a Node renamed for display and not a different technical type for each workspace role.

A Page may have a parent Page, child Pages, identity, display configuration, navigation visibility, and placements for configured tool views. A Page may reference Nodes or records that it presents, but displaying a record does not automatically make the Page its owner.

Any Page may contain subpages. Nesting is recursive; a Page with children acts as a parent or “Master Page” because of its relationships, not because it is a separate entity type. A Page with no children is still complete.

A newly created Page should be able to start empty. It must not receive mandatory fields, capabilities, widgets, child content, or automatic sidebar visibility unless the user or an explicitly selected template configures them.

### 3.2 Node

A **Node** is a general-purpose user-owned organizational entity, such as a subject, project, goal, responsibility, or other user-defined concept. Nodes may have their own parent-child hierarchy, fields, supported capabilities, relationships, and history.

Nodes are not Pages. Node hierarchy does not define Page navigation, and a Node may be displayed by a Page or tool without being owned by that Page or automatically appearing in navigation.

### 3.3 Capability

A **Capability** describes behavior a tool or Node can support. Examples include task tracking, progress tracking, or notes. Capabilities, tool implementations, Page placements, Nodes, and specialist operational records are distinct concepts; configuration and data ownership must be explicit.

### 3.4 View

A **View** is a presentation of information, such as a list, table, calendar, timeline, chart, or card layout. Changing a view must not inadvertently redefine or destroy the underlying data.

### 3.5 System Module

A **System Module** is a fixed part of the FocusOS environment that provides core navigation or infrastructure. Specialist features should generally be capabilities rather than permanent system modules.

## 4. Fixed System Areas

FocusOS exposes four fixed system areas:

1. **Dashboard** — displays the user's configured overview.
2. **Pages** — creates, manages, and navigates user-configured Pages.
3. **Calendar** — provides calendar and scheduling functionality.
4. **Settings** — configures preferences, Pages, capabilities, and system behavior.

The Pages management area is fixed; the individual Pages created by the user are not predefined system modules. The existence of a fixed Pages area must not force users into a predefined set of organizational categories.

## 5. Universal Node and Page Requirements

**Status: Partial / Unverified.** The domain model is documented, but the full authenticated lifecycle and persistence behavior still require end-to-end verification.

A Node may include:

- Identity: name, icon, color, and description.
- Status and retention behavior, including archive and deletion rules.
- Parent and child relationships.
- Sort and order information.
- Custom fields.
- Attached capabilities and their configuration.
- Node-specific configuration and presentation metadata where supported; Page layout, navigation visibility, and view placements belong to the Page model.
- Relationships to other Nodes.
- Activity and history records.
- Created and modified timestamps.

Requirements:

- Users can create, edit, organize, and configure Nodes.
- Nodes support nested parent-child relationships without a product-imposed shallow hierarchy limit.
- A Node's parent-child relationship defines organizational structure; it does not by itself require sidebar visibility.
- Users control which eligible Nodes/Pages appear in navigation and how they are ordered.
- A Page runtime renders only the features configured for that Page.
- Configuration and runtime presentation remain separate concerns.
- Refreshing or returning in a later authenticated session must not lose saved data.
- Archive, deletion, restoration, and retention behavior must be explicit and must not silently destroy meaningful history.
- Legacy Workspace navigation must be removed or redirected safely when it is no longer an intended product surface.

## 6. Capability Requirements

**Status: Partial / Planned by capability.** Existing specialist features are present in the project, but the unified Page-bound capability model and safe migration of legacy data require verification and further work.

Capabilities represent reusable behavior supported by tools or Nodes. Pages place configured tool views; they do not duplicate the underlying capability records. Built-in capabilities should be registered through a controlled mechanism. Future user-created capabilities should use validated schemas rather than uncontrolled executable code.

### 6.1 Capability families

- **Productivity:** Tasks, Checklists, Notes, Reminders, Timer, Pomodoro, Goals.
- **Planning:** Events, Scheduling, Timetables, Recurring Schedules, Timeline.
- **Tracking:** Checkbox, Counts, Duration, Percentage, Numeric Measurements, Habits, Streaks, Progress.
- **Organization:** Tables, Lists, Tags, Categories, Files, Links.
- **Analytics and presentation:** Progress Indicators, Counters, Statistics, Charts, Calendar Views, Timeline Views, Cards.
- **Future capabilities:** Forms, Automations, Workflows, Dependencies, Calculations, Integrations, AI, and a user-facing capability builder.

### 6.2 Composition requirements

Users should be able to combine capabilities to suit their needs. Examples include:

- A Fitness Page combining Workout Logs, Measurements, Goals, and Analytics.
- A Study Page combining Tasks, Focus Sessions, and Time Tracking.
- A Personal Page combining Habits, Routines, and Notes.

Specialist-app features should not become fixed top-level modules unless they provide essential system infrastructure. Existing standalone Pomodoro, Habits, Exercise, Tasks, Timetables, and Study/Work surfaces should migrate toward Page-bound capabilities only after the replacement foundation is verified.

### 6.3 Capability quality requirements

For applicable mature tracking capabilities:

- Associate records with a stable owner and relevant Node/Page.
- Support appropriate units, cadence, and configuration.
- Preserve meaningful event and history records instead of relying only on transient checkbox state.
- Support start/stop and/or manual entry for duration-based concepts.
- Derive summaries from source records where practical rather than maintaining inconsistent duplicate totals.
- Provide useful date-range filtering and history views.
- Support targets and progress where meaningful.
- Keep raw records inspectable or exportable before adding advanced analytics.
- Ensure missed days or incomplete periods do not erase prior history or permanently invalidate records.

FocusOS should not copy gamification, blocking, social features, billing, or device-specific integrations unless they serve a clear personal operating-system need.

## 7. Dashboard Requirements

**Status: Partial / Unverified.** Dashboard UI contracts have been reviewed, but the complete customization and persistence workflow requires broader verification.

The Dashboard is a fixed system area whose content is user-configurable. Users should be able to:

- Add, remove, enable, disable, reorder, and configure widgets.
- Move and resize widgets where supported by the layout.
- Hide, show, collapse, and duplicate widgets where supported.
- Create and switch between multiple dashboard layouts.
- Display information from configured capabilities and Nodes.

Potential widget content includes greetings, time, dates, progress, deadlines, tasks, reminders, statistics, charts, timers, notes, counters, and calendars.

The rendered Dashboard and its configuration editor must remain separate: the Dashboard displays the saved configuration, while configuration and layout editing take place through the appropriate Settings surface. A greeting may be displayed above the widget grid and need not itself be represented as a grid widget.

## 8. Calendar and Scheduling Requirements

**Status: Unverified.** The required behavior is defined, but the current verification record does not establish full end-to-end coverage of calendar and scheduling workflows.

The Calendar must support:

- Standalone events and events associated with Nodes.
- Multiple calendar systems, including Gregorian and Hijri where supported.
- Configurable primary and secondary calendar systems.
- Language and regional preferences.
- Date and time formats.
- Time-zone selection.
- First day of week.
- Multiple calendar views.
- Configurable visibility of Node-linked events.
- Scheduling and recurring behavior where the corresponding capability supports it.

Calendar-linked records must persist and display consistently with the configured time zone and calendar preferences.

## 9. Identity, Onboarding, and Personalization

**Status: Partial / Unverified.** Some preference and greeting behavior has been reviewed and tested; the full onboarding and personalization journey requires further verification.

First-login onboarding should guide initial setup without assuming a fixed identity or workflow. Configurable options should include:

- Display name.
- Greeting prefix, such as Assalamualaikum, Namaste, or a custom greeting.
- Time-based greetings for morning, afternoon, evening, and night.
- Custom greeting mode.
- Clock visibility and format.
- Date visibility and calendar system.
- Time zone.
- Language and region.
- Guided setup for Nodes, capabilities, Dashboard, and Calendar.

The default greeting may combine a configured greeting prefix, a time-based greeting, and the user's display name. The complete greeting behavior must remain configurable.

## 10. Accessibility and Localization

**Status: Planned / Partial.** Requirements are defined; comprehensive accessibility and localization verification remains outstanding.

FocusOS must not assume English, Gregorian dates, a specific region, or a single time format.

Settings should support, as implemented and expanded over time:

- Application language and regional formatting.
- Calendar systems, date format, time format, time zone, and first day of week.
- Font and interface scale.
- Contrast and theme.
- Interface density and reduced motion.
- Keyboard navigation and visible focus indicators.
- Adequate interaction targets.
- Screen-reader-friendly structure and labels.
- Notification and sound preferences.

Accessibility and localization must be considered in shared components and interaction patterns, not only in individual screens.

## 11. Data, Security, and Reliability

**Status: Partial / Unverified.** Core preference logic and the production build have passed local checks, but full authenticated workflow, persistence, and Firestore ownership/rules verification remain release gaps.

Requirements:

- Persist meaningful user actions in Firestore.
- Do not treat temporary UI state as durable history.
- Preserve meaningful user records and activity history.
- Enforce owner-only access to private user data.
- Validate data at domain and persistence boundaries.
- Use safe, documented, preferably additive migrations.
- Avoid destructive transformations without explicit consent and a recovery strategy.
- Keep pure business logic testable outside the UI.
- Ensure the UI communicates save failures rather than implying unsaved changes were persisted.
- Verify behavior across refreshes and new authenticated sessions.
- Avoid describing the product as production-ready based only on a successful build or homepage smoke test.

## 12. Implementation Status Summary

These labels summarize the current assessment of major capability groups. They are not substitutes for test evidence. Detailed check results, verification dates, and release risks belong in CURRENT_VERIFICATION.md.

| Capability group | Status | Qualification |
|---|---|---|
| Application foundation, preferences, and build | Partial | Core tests and a production build have passed locally; broader release checks remain |
| Universal Node/Page model and runtime | Partial / Unverified | Model is defined; authenticated creation, nesting, configuration, and persistence require end-to-end verification |
| Dashboard | Partial / Unverified | Some UI contracts have been reviewed; complete customization and persistence need broader verification |
| Calendar and scheduling | Unverified | Requirements are defined; full workflows are not yet established by the current verification record |
| Built-in capabilities and legacy migration | Partial / Planned by capability | Legacy surfaces exist; migration to a unified Page-bound model requires further implementation and verification |
| Authentication, data ownership, and security | Unverified pending end-to-end checks | Build and unit-test results do not establish protected-route behavior or Firestore ownership isolation |
| Accessibility and localization | Partial / Planned | Requirements are defined; comprehensive coverage remains outstanding |
| Awwab and advanced autonomous behavior | Planned / Out of current scope | Consider only after the FocusOS foundation and its domain interfaces are stable |

Status definitions:

- **Implemented:** The stated capability is present and the required behavior has supporting verification evidence.
- **Partial:** Some behavior exists, but material requirements remain incomplete.
- **Planned:** The capability or requirement has not yet been implemented.
- **Unverified:** Implementation may exist, but current behavior has not been adequately confirmed.
- **Partial / Planned by capability:** Status varies among capabilities within the group; individual capabilities must not inherit a stronger status without evidence.

A basic implementation does not make every advanced requirement in its group implemented. Where evidence is incomplete, use Unverified rather than assuming success.

## 13. Scope Boundaries

### Current foundation scope

The current foundation focuses on:

- Secure single-owner use.
- Configurable user preferences.
- A consistent Node/Page model.
- Reusable capabilities attached to Nodes.
- Dashboard customization.
- Calendar and scheduling foundations.
- Reliable persistence and safe handling of existing data.

### Out of scope for the current foundation

- Awwab assistant behavior.
- AI chat and autonomous planning.
- Voice assistant behavior.
- A complex automation engine.
- Multi-user collaboration.
- Uncontrolled runtime plugin execution.

These may be considered after the FocusOS foundation is stable and its domain interfaces, permissions, and data contracts are reliable.

## 14. Acceptance Criteria

The foundation is not considered complete until the applicable criteria below are demonstrated in the running application and verified with suitable tests.

1. A user can sign in, sign out, and access protected areas only while authorized.
2. A user can configure their identity and preferences, and those preferences persist.
3. A user can create, edit, organize, and nest Nodes without being forced into predefined life categories.
4. A Page presents only the fields, tool views, and presentation features configured for it; displaying a Node or record does not implicitly make that data Page-owned.
5. A newly created Page can remain empty and does not automatically appear in navigation unless configured to do so.
6. A user can attach and configure supported capabilities on relevant Nodes.
7. A user can configure the Dashboard through its designated configuration surface without turning the Dashboard homepage into an editor.
8. Dashboard layout and widget settings persist across refreshes and later authenticated sessions.
9. Calendar preferences and supported standalone or Node-linked events behave consistently with the configured date, time, calendar, and time-zone settings.
10. Meaningful records and history remain available after refresh and a new authenticated session.
11. Access controls prevent one user from reading or changing another user's private records.
12. Legacy data is preserved through any migration, and legacy functionality is not retired until its replacement has been verified.
13. Core workflows remain usable on mobile layouts and support appropriate keyboard navigation, visible focus, and accessible labels.
14. Automated tests, authenticated end-to-end checks, Firestore ownership/rules checks, and production smoke checks provide evidence before release sign-off.

Acceptance criteria that depend on capabilities not yet implemented remain requirements; they must not be treated as completed solely because they are documented here.
