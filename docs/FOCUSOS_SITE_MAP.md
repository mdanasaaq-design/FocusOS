# FocusOS — Exhaustive Product / UI / Function Inventory

> **Purpose of this file:** This is the review contract for FocusOS.
>
> It is intentionally much more detailed than a normal sitemap. It records the user-visible product surface, visible wording, controls, routes, interactions, state changes, persistence expectations, navigation rules, responsive behavior, and feature boundaries so product changes can be requested without inspecting source code.
>
> **Review syntax:** `Location → current behavior → requested behavior`.
>
> **Important:** User-generated content (Page names, task names, event names, custom capability names, etc.) cannot be enumerated in a static document. This file therefore inventories **every product-controlled visible surface and interaction** that the application exposes; dynamic user data is represented by its control/template.

---

## 0. How to use this document

For every change, identify:

- **Location**
- **Visible text/control**
- **Current behavior**
- **Desired behavior**
- **Whether data should persist**

Examples:

- `Dashboard → Time → make the clock larger.`
- `Pages → Create Page → remove the icon selector.`
- `Personal → Tasks → Add Task saves but disappears after refresh.`
- `Settings → Language → add Malayalam.`
- `Sidebar → logo → make it navigate home instead of reloading.`

A feature is considered complete only when it is:

**visible + interactive + saved + readable after refresh + error handled + responsive.**

---

# 1. Product model

FocusOS is organized around:

```
Application shell
    ↓
Dashboard
    ↓
Pages
    ↓
Capabilities
    ↓
Activity / History
    ↓
Dashboard / Analytics
```

The primary organizational model is:

```
Page / Folder
├── Child Pages / folders
├── Nodes / items
├── Capabilities
└── Activity / History
```

A child Page is a real Page, not merely a visual subsection.

A Page can therefore contain another Page just as a folder can contain another folder.

Example:

```
Personal
├── College
│   ├── AIML
│   │   ├── Semester 5
│   │   └── Mini Project
│   └── Notes
├── Finance
│   ├── Expenses
│   └── Savings
└── Health
    ├── Habits
    └── Workouts
```

Each Page in that tree can independently have its own capabilities, activity/history, Nodes/items, navigation state and Dashboard pin.

---

# 2. Authentication / application entry

## Routes

| Route | Visible product |
|---|---|
| `/` | Dashboard |
| `/pages` | Pages manager |
| `/page/:pageId` | Page overview |
| `/page/:pageId/:viewKey` | Page capability/history view |
| `/pages/node/:nodeId` | Node detail |
| `/calendar` | Calendar |
| `/timetables` | Timetables |
| `/study` | Study |
| `/pomodoro` | Pomodoro |
| `/exercise` | Exercise |
| `/habits` | Habits |
| `/settings` | Settings hub |
| `/settings/configuration` | Configuration |
| `/workspace` | Redirects to Pages |
| `/workspace/node/:nodeId` | Redirects to Node detail |
| unknown route | Redirects to Dashboard |

## Loading state

Visible:

**Loading…**

The application uses a protected authenticated shell.

## Error boundary

When a screen crashes, the visible recovery screen contains:

**FocusOS recovered from an error**

**This screen could not be loaded.**

**Your data was not intentionally changed. Check your settings or reload the page.**

Button:

**Reload FocusOS**

---

# 3. Global application shell

## Desktop

Layout:

```
┌──────────────┬─────────────────────────────┐
│ Sidebar      │ Main content                │
│              │                             │
│ Logo         │ Current screen              │
│ New Page     │                             │
│ Search Pages │                             │
│ Dashboard    │                             │
│ Pages        │                             │
│ Calendar     │                             │
│ User Pages   │                             │
│              │                             │
│ Settings     │                             │
│ Sign out     │                             │
└──────────────┴─────────────────────────────┘
```

## Mobile

Visible controls include:

- menu button
- bottom navigation
- Dashboard
- Pages
- Calendar
- Settings

The sidebar becomes an off-canvas mobile panel.

## Skip link

Keyboard-accessible visible-on-focus control:

**Skip to content**

It targets the main content region.

---

# 4. Sidebar — exhaustive inventory

## Header

### Logo

Visible:
- FocusOS logo mark only.
- The word **FocusOS** is not shown beside it.

Interaction:
- Click logo.
- Current implementation reloads the current page.

Accessibility:
- Label: **Reload FocusOS**
- Title: **Reload FocusOS**

### Desktop sidebar toggle

Collapsed state:
- Expand sidebar icon.

Expanded state:
- Collapse sidebar icon.

Accessible labels:
- **Expand sidebar**
- **Collapse sidebar**

## New Page

Button:

**New Page**

Collapsed sidebar:
- icon only
- tooltip/title: **New Page**

Click behavior:
- Opens Pages.

## Search

Label:

**Search Pages**

Placeholder:

**Search Pages**

Search behavior:
- Filters navigation Pages.
- Matching descendants/ancestors remain visible so nested Page context is preserved.
- Empty search returns all visible navigation Pages.

No results:

**No Pages found.**

No Pages:

**Create a Page to add it here.**

## Fixed primary navigation

### Dashboard

Visible label:

**Dashboard**

Route:

`/`

Icon:
- Home

### Pages

Visible label:

**Pages**

Route:

`/pages`

Icon:
- Layout Grid

### Calendar

Visible label:

**Calendar**

Route:

`/calendar`

Icon:
- Calendar

## User Page navigation

A Page appears in primary navigation only when its configuration says it should.

Rules:

- Explicit **Primary navigation** means it appears in the sidebar.
- Dashboard pin can automatically promote a Page to primary navigation.
- The promotion is tracked separately so automatic promotion can be reversed.
- Child Pages can appear nested beneath their parent.
- Active Page receives active styling.
- Parent receives active-child hint.
- Nested Pages can be expanded/collapsed.
- Sidebar expansion state is persisted locally.
- Sidebar itself can be collapsed.
- Page navigation must not look like a bullet list.

## Page tree controls

For a Page with children:

- expand chevron
- collapse chevron
- Page icon
- Page name
- active state
- nested indentation

A child Page can itself contain children.

## Settings

Visible label:

**Settings**

Route:

`/settings`

Icon:
- Settings

## Sign out

Visible label:

**Sign out**

Action:
- logs the authenticated user out.

Icon:
- Log out

---

# 5. Pages manager

Route:

`/pages`

Purpose:

Create, organize, edit, archive and trash Pages.

## New Page form

Controls:

### Icon selector
Label:

**Page icon**

Uses the same Lucide icon family.

### Name

Placeholder:

**New Page name...**

### Create button

Visible:

**Create Page**

Success message:

**Page created ✓**

Error:

**Unable to create Page.**

New Pages are root Pages.

There is intentionally no creation-time Root Page dropdown.

There is intentionally no preset dropdown.

There is intentionally no Blank / Focus / Project / Habit / Fitness preset system.

There is intentionally no Page fields builder.

---

# 6. Page icon inventory

The current icon picker contains:

- home
- check
- clock
- star
- heart
- sun
- sparkles
- circle
- circle-dot
- diamond
- triangle
- cloud
- zap
- coffee
- book
- briefcase
- house
- target
- fitness
- note
- calendar
- idea
- tools
- palette
- music
- wallet
- growth
- rocket
- brain
- badge
- folder

Icons are Lucide-style and should visually belong to the same icon family as Dashboard, Pages and Calendar.

---

# 7. Pages manager — left tree

Section label:

**Pages**

Search:

**Search Pages...**

Each Page row can show:

- expand/collapse control
- Page icon
- Page name
- child count
- selected/active state

Hierarchy is recursive.

Example:

```
Personal
  College
    AIML
      Semester 5
  Finance
    Expenses
```

Clicking a Page selects it for editing.

If there are unsaved changes, switching Pages asks:

**You have unsaved Page changes. Switch Pages and discard them?**

---

# 8. Page editor

Header distinguishes:

**Page: [name]**

or:

**Child Page: [name]**

Child Page description:

**This Page is a folder inside its parent. It has its own capabilities, items and history.**

Root Page description:

**This Page can contain child Pages, like folders inside folders.**

Action:

**Open Page**

This opens the real Page view.

---

# 9. Page identity

Visible controls:

## Icon

The Page icon picker.

## Name

Editable Page name.

## Description

Placeholder:

**Optional Page description**

## Color

Color picker.

## Save

Button states:

**Save Page**

**Saving…**

**Saved**

Success:

**Page saved ✓**

---

# 10. Child Pages / folders

## Core behavior

A Page can create a Page inside itself.

The UI says:

**Child Pages**

Description:

**Create folders inside this Page. Each child is a complete Page with its own capabilities, items and history.**

Form:

### Child icon

Icon selector.

### Child name

Dynamic placeholder:

**New Page inside “[parent name]”...**

### Add child

Button:

**Add child**

Success:

**Child Page created ✓**

## Child Page cards

Each child displays:

- icon
- name
- Page/Folder indicator
- open arrow

A child with children is treated as a folder.

## Folder semantics

A nested Page must support:

- children
- grandchildren
- capabilities
- Nodes/items
- activity
- history
- navigation
- Dashboard pin
- its own settings
- its own configuration

The parent does not own the child's activity merely because the child is nested.

---

# 11. Archived Pages

Section appears when archived Pages exist.

Heading:

**Archived Pages**

Description:

**Archive hides a Page without deleting its data.**

Each archived Page has:

**Restore**

Restore success:

**Restored [Page] ✓**

---

# 12. Page archive / trash

Actions:

**Archive Page**

or:

**Restore Page**

Trash action:

**Move to Trash**

Confirmation:

**Move “[Page]” to Trash? Its child Pages and Page data will also be moved to Trash.**

Success:

**Page and its child Pages moved to Trash.**

Trash is separate from archive.

Expired trash is automatically purged.

---

# 13. Page capabilities

Heading:

**Capabilities**

Description:

**Attach only the behaviors this Page needs. Activity is stored against this Page.**

Current built-in capabilities:

1. Tasks
2. Focus Sessions
3. Timer
4. Habits
5. Goals
6. Workouts
7. Measurements
8. Analytics

Each capability has:

- checkbox
- name
- description
- configuration where applicable

Only enabled capabilities appear as Page navigation/views.

---

# 14. Capability: Tasks

Visible concept:

**Tasks**

Purpose:

Create, prioritize, schedule and complete tasks.

Expected controls:

- task title/name
- deadline
- priority
- reminder/recurrence where available
- Add Task
- task list
- completion control

Expected lifecycle:

```
Create
→ Firebase write
→ immediate UI update
→ refresh
→ record remains
→ edit/complete
→ activity/history
```

Required states:

- empty
- adding
- saved
- error
- completed
- persisted

No task should disappear merely because the screen is refreshed.

---

# 15. Capability: Focus Sessions

Visible label:

**Focus Sessions**

Purpose:

Structured focus/break sessions.

Configuration:

- focus minutes
- break minutes

Expected flow:

```
Focus
→ Break
→ Focus
→ completed session
→ saved history
```

A completed session must be durable.

---

# 16. Capability: Timer

Visible label:

**Timer**

Purpose:

General elapsed-time tracking.

Expected flow:

```
Start
→ elapsed time
→ Stop
→ save
→ history
```

Timer does not require focus/break cycles.

---

# 17. Focus Sessions / Pomodoro / Timer distinction

| System | Main purpose |
|---|---|
| Focus Sessions | Structured focus/break sessions |
| Pomodoro | Traditional Pomodoro workflow |
| Timer | General elapsed-time tracking |

Product direction:

Pomodoro should eventually be a mode/workflow of Focus Sessions rather than three competing systems.

---

# 18. Capability: Habits

Visible label:

**Habits**

Purpose:

Recurring behaviors.

Expected controls:

- habit name
- cadence
- reminder time
- Add Habit
- completion/check control
- streak

Cadence:

- Daily
- Weekly
- Monthly

Expected persistence:

- definition
- schedule
- reminder
- completion records
- streak
- dates
- Page association

Monthly cadence must use the application's defined cadence logic, not pretend every month is exactly 30 days.

---

# 19. Capability: Goals

Visible label:

**Goals**

Purpose:

Measurable targets.

Expected data:

- goal name
- target
- current value
- unit
- progress entries
- completion state
- history

---

# 20. Capability: Workouts

Visible label:

**Workouts**

Expected data:

- exercise
- sets
- reps
- load
- duration
- date
- Page

Expected behavior:

Create → Save → Read → History → Analytics.

---

# 21. Capability: Measurements

Visible label:

**Measurements**

Expected data:

- measurement name/type
- numeric value
- unit
- date
- Page
- history

---

# 22. Capability: Analytics

Visible label:

**Analytics**

Purpose:

Turn real saved Page activity into summaries.

Potential inputs:

- tasks
- habits
- focus minutes
- timer minutes
- workouts
- measurements
- goals
- deadlines
- trackers
- other activity

Analytics must use real persisted activity.

---

# 23. Capability configuration

Some capabilities have configuration.

Tasks:
- Default view: list / board

Focus Sessions:
- Focus minutes
- Break minutes

Configuration is saved with the Page configuration.

---

# 24. User-created capabilities

Settings can create custom capabilities.

A custom capability is identified internally as:

`custom:[id]`

A custom capability can have:

- name
- description
- fields

Custom capability routes use:

`/page/[pageId]/custom_[id]`

Custom capabilities must follow the same persistence/history contract as built-in capabilities.

---

# 25. Page view

Route:

`/page/:pageId`

Header contains:

- Page icon
- Page name
- Page description if present
- **Configure** button

Configure action opens:

`/pages?edit=[pageId]`

## Page navigation

Always available:

**Overview**

Available when configured:

- Tasks
- Focus Sessions
- Timer
- Habits
- Goals
- Workouts
- Measurements
- Analytics
- custom capabilities

Always available:

**History**

---

# 26. Page Overview

If configured fields exist:

Heading:

**Page information**

Description:

**Your configured fields.**

Controls:

- field inputs
- required marker `*`
- units
- validation messages
- Save

Save button:

**Save**

Saving state:

**Saving…**

Required-field error:

**This field is required.**

General error:

**Complete the required Page fields before saving.**

Fields are saved as a Page field snapshot activity record.

---

# 27. Empty Page state

Visible:

**This Page is empty. Configure fields or capabilities in Pages.**

This is shown when there are no fields and no capabilities.

---

# 28. Page capability cards

Each enabled capability can appear as a card.

Card wording:

**Open [capability] for this Page.**

Click opens the corresponding capability view.

---

# 29. Sub-pages in Page view

Section:

**Sub-pages**

Description:

**Build this Page into its own hierarchy.**

Shows child count.

Child creation:

**New sub-page**

Button:

**Add**

Child card:

- icon
- name
- **Open**

This provides a second, contextual way to create nested Pages from inside a Page.

---

# 30. Page items / Nodes

When child display is enabled, item creation includes:

Placeholder:

**New item**

Add button:
- plus icon

Items are Nodes, not child Pages.

Difference:

- **Child Page** = folder / independent Page
- **Node/item** = structured object belonging to a Page

---

# 31. Page history

Navigation:

**History**

Header:

**Page history**

**Activity history**

Description:

**Durable records created by this Page and its capabilities.**

Counter:

**[number] records**

Filters:

### Search
Placeholder:

**Search history…**

### Capability
Default:

**All capabilities**

### Status
Default:

**All statuses**

### Reset

Button:

**Reset**

History can filter by:

- title
- type
- capability
- date
- value
- unit
- status

---

# 32. History records

Each record can show:

- title
- capability
- type
- status
- date
- value
- unit

Actions:

**Edit**

**Delete / hide**

Edit prompt:

**Edit history title**

Delete confirmation:

**Hide this history record?**

After hiding:

**History record hidden.**

Undo:

**Undo**

History is soft-deleted rather than immediately destroyed.

History must remain durable even if the originating capability is later disabled.

---

# 33. Node detail

Route:

`/pages/node/:nodeId`

Purpose:

Configure an individual Node.

Node identity can include:

- name
- description/identity fields
- Page association
- capabilities

Capabilities assigned to a Node are used by Dashboard Builder.

Configure Page action:

- opens the owning Page configuration.
- no legacy `/settings?node=` route.

---

# 34. Dashboard

Route:

`/`

Purpose:

Personal command center.

## Top greeting

Greeting is outside the Dashboard grid.

Two independent pieces:

1. configurable greeting prefix
2. time-based greeting

Default prefix:

**Assalamualaikum warahmatullahi wabarakatuhu**

The greeting may include the user's display name.

The old breadcrumb:

**FocusOS > Dashboard**

is intentionally removed.

The normal Dashboard has no:

**Customize Dashboard**

button.

Customization belongs in Settings.

---

# 35. Dashboard clock

Clock is a separate grid card.

The clock supports:

- Digital
- Analog
- Minimal
- Flip
- Binary

Time configuration:

- 12-hour
- 24-hour
- seconds on/off
- timezone

24-hour mode uses a true 00–23 hour cycle.

Example:

**01:24:45**

not:

**1:24:45**

when zero-padding is enabled.

---

# 36. Dashboard grid

The grid supports:

- automatic arrangement
- dense packing
- widget width
- widget height
- up to 24 columns
- responsive behavior
- no overlap

Normal view uses automatic CSS grid placement.

Editable layouts store explicit placement.

Mobile uses a one-column presentation where appropriate.

A widget must never visually sit on top of another widget.

---

# 37. Dashboard widgets — current inventory

## Time

Shows current clock.

## Date

Shows current date/calendar representation.

## Deadlines

Shows upcoming deadlines.

## Reminders

Shows upcoming reminders.

## Tasks

Shows task information.

## Habits

Shows habit progress/streak information.

## Calendar

Shows calendar information/events.

## Timetable

Shows active timetable and progress.

## Pomodoro

Shows Pomodoro information.

## Exercise

Shows exercise information.

## Statistics

Shows activity statistics.

Current wording includes:

**Today**

and a total activity record count.

## Notes

Shows note count/content where applicable.

Empty state:

**No notes yet**

## Counter

Configurable manual counter.

Default title:

**Counter**

Default label:

**Manual counter**

## Progress

Configurable progress presentation.

## Pie Chart

Displays percentage/distribution.

## Donut Chart

Displays progress with center value.

## Bar Chart

Displays values across a time range.

## Line Chart

Displays trends.

Visible time wording:

**Last [N] days**

## Area Chart

Displays trend area.

## KPI

Shows a prominent current value.

Default secondary wording:

**Current value**

## Progress Chart

Shows:

- source
- current percentage
- progress bar

## Analysis Table

Shows compact values across a selected range.

## Heatmap

Shows activity density.

## Node Capabilities

Heading:

**Node Capabilities**

Empty state:

**No dashboard-visible nodes configured yet.**

Shows Node name and number of capabilities.

## Pages

Heading:

**Pages**

Empty state:

**No Pages are configured for Dashboard visibility.**

Shows Dashboard-visible Pages.

## Page Capability

Shows:

- Page name
- capability name
- Open Page

If Page disappeared:

**Page no longer available.**

---

# 38. Dashboard Builder

Location:

Settings / Dashboard configuration.

Functions:

- select Dashboard
- create/manage dashboard layouts where supported
- choose number of columns
- add widgets
- remove widgets
- duplicate widgets
- configure widgets
- select Page
- select Node
- select Node capability
- select Page capability
- resize widgets
- arrange widgets
- save layout

Column range:

**1–24**

Node capability selector must only expose capabilities actually assigned to the selected Node.

---

# 39. Dashboard Page pinning

Page setting:

**Pin to Dashboard**

Meaning:

- Page appears on Dashboard.
- Pinning automatically promotes it to primary navigation.

The promotion is tracked independently.

Correct behavior:

```
Primary navigation = explicitly enabled
                    OR
                    temporarily promoted by Dashboard pin
```

Unpin:

- removes Dashboard pin
- removes only the automatic navigation promotion
- preserves explicit primary-navigation preference

This distinction is important.

---

# 40. Calendar

Route:

`/calendar`

Header:

**Calendar**

Description:

**Plan, schedule and manage events across your calendar.**

Primary action:

**Event**

## Month controls

- Previous month
- Today
- Next month

Accessible labels:

**Previous month**

**Next month**

Month heading:
- current month name
- current year

Secondary calendar text can show Hijri.

Summary:

**[N] deadlines**

**[N] events**

## Weekday headings

- Sun
- Mon
- Tue
- Wed
- Thu
- Fri
- Sat

## Calendar cells

Each cell can show:

- date number
- count
- Deadline entries
- Event entries
- `+[N] more`

Deadline format:

**Deadline · [task title]**

Event format:

**[time] · [event title]**

---

# 41. Calendar event creation

Button:

**Event**

Modal:

### Add mode

**Add event**

### Edit mode

**Edit event**

Close control:
- Close

Fields:

**Event name**

**Description (optional)**

**Date**

**Time**

**Repeat**

**Page**

Repeat options:

- One time
- Daily
- Weekly
- Monthly

Page options:

- General
- all active Pages

Actions:

**Delete** — edit mode only

**Cancel**

**Save event**

---

# 42. Calendar navigation behavior

Previous:

moves one month backward.

Next:

moves one month forward.

Today:

returns both visible month and selected date to today.

Selecting a date:
- changes selected date
- calendar remains in current month.

The calendar must not be permanently stuck on one month.

The calendar must support planning future and past months.

---

# 43. Calendar responsiveness

Desktop:
- 7 columns
- full-width calendar

Mobile:
- still 7 columns
- smaller gaps
- smaller text
- smaller cell heights
- controls wrap
- event button becomes full width
- no horizontal overflow

---

# 44. Legacy / specialist pages

The application still has routes for:

- Timetables
- Study
- Pomodoro
- Exercise
- Habits

These are legacy/specialist surfaces while the universal Page + Capability model is the long-term product structure.

They must not silently conflict with the universal capability system.

---

# 45. Settings hub

Route:

`/settings`

Purpose:
Settings entry point.

Configuration route:

`/settings/configuration`

Legacy settings route:

`/settings/legacy`

redirects to configuration.

---

# 46. Settings — profile

Profile-related settings include:

- display name
- Hijri adjustment

Profile data is saved separately from general configuration.

---

# 47. Settings — language

Heading/area:

Language.

Current supported language list:

- English
- العربية
- বাংলা
- Deutsch
- Español
- فارسی
- Français
- ગુજરાતી
- עברית
- हिन्दी
- Bahasa Indonesia
- Italiano
- 日本語
- ಕನ್ನಡ
- 한국어
- മലയാളം
- मराठी
- नेपाली
- Nederlands
- ਪੰਜਾਬੀ
- Polski
- Português
- Română
- Русский
- සිංහල
- Svenska
- தமிழ்
- తెలుగు
- ไทย
- Türkçe
- Українська
- اردو
- Tiếng Việt
- 中文

Default behavior:

- detect device language
- use it when supported
- otherwise English

---

# 48. Settings — regional format

Controls the locale used for formatting dates/times and other regional presentation.

Detected device locale is available.

---

# 49. Settings — timezone

Default:

device-detected timezone.

Detected timezone is shown.

Available common choices include:

- device timezone
- Asia/Kolkata
- Asia/Dubai
- Asia/Riyadh
- Europe/London
- America/New_York
- America/Los_Angeles
- Asia/Tokyo
- Australia/Sydney

A **Use device** action is available.

Timezone affects:

- clock
- dates
- calendar
- activity date handling
- timetable/day calculations
- greeting time

---

# 50. Settings — clock

Clock style options:

- Digital
- Analog
- Minimal
- Flip-style
- Binary-style

Clock behavior:

- enabled/disabled
- seconds shown/hidden
- 12-hour/24-hour
- timezone

---

# 51. Settings — greeting

Controls:

- Show greeting
- greeting prefix
- include display name
- hide display name

Default prefix:

**Assalamualaikum warahmatullahi wabarakatuhu**

Greeting prefix and time greeting are separate.

---

# 52. Settings — calendars

Primary calendar choices:

- Gregorian
- Islamic Hijri
- Islamic Umm al-Qura
- Persian
- Hebrew
- Buddhist
- Japanese
- Indian National
- Chinese

Secondary calendar:
- selectable
- can be shown/hidden

Additional calendars:
- user can add additional calendar definitions
- custom calendar name is entered
- added calendars are persisted

---

# 53. Settings — accessibility

Current intended controls:

## Interface size

- Normal
- Large
- Extra large

## Interface density

- Compact
- Comfortable
- Spacious

## High contrast

Toggle.

## Reduce motion

Toggle.

## Larger controls

Toggle.

Accessibility exists to control presentation rather than product data.

---

# 54. Settings — Page management

Settings also exposes Page configuration.

Current controls include:

- Page selector
- Page name
- Page description
- Page icon
- Page color
- capabilities
- primary navigation
- Dashboard pin
- navigation order
- save
- archive

Primary navigation wording:

**Primary navigation**

Description:

**Show alongside Dashboard, Pages and Calendar.**

Dashboard pin wording:

**Pin to Dashboard**

Current intended explanation:

**Pinning adds this Page to Dashboard and primary navigation. Unpinning removes the automatic navigation promotion.**

---

# 55. Settings — custom capabilities

Custom capability creation includes:

- capability name
- description
- fields
- save
- loading state
- error state

Custom capabilities must become usable on Pages and persist like built-in capabilities.

---

# 56. Data / persistence contract

Primary persistence technology:

Firebase / Firestore.

Data belongs to the authenticated user's own UID.

Conceptual structure:

```
users/
└── {uid}/
    ├── profile
    ├── configuration
    ├── pages/
    ├── nodes/
    ├── activity/
    ├── reminders/
    ├── deadlines/
    ├── habits/
    ├── habit logs/
    ├── timetables/
    ├── timetable completions/
    ├── pomodoro sessions/
    └── exercise logs/
```

The exact storage collection can evolve, but the user-data ownership boundary must remain.

---

# 57. Activity/history contract

A capability is not considered functional if it only renders a form.

Required:

```
UI
+
event handler
+
Firebase write
+
real-time/readback
+
refresh persistence
+
edit/update where applicable
+
completion where applicable
+
history/activity
+
error handling
```

Activity can contain:

- pageId
- nodeId
- capability
- type
- title
- date
- status
- durationMinutes
- dueDate
- priority
- value
- unit
- metadata
- targetId
- scheduleId
- source
- deletedAt
- createdAt
- updatedAt

---

# 58. Universal capability acceptance test

For every capability:

1. Enable capability.
2. Open capability.
3. Create one real record.
4. Confirm visible immediately.
5. Refresh.
6. Confirm record still exists.
7. Edit if supported.
8. Confirm edit persists.
9. Complete/track if supported.
10. Confirm history exists.
11. Disable capability.
12. Confirm history remains.
13. Re-enable capability.
14. Confirm data is still available.

No capability should be considered complete merely because its controls are visible.

---

# 59. Responsive product contract

Every screen must work on:

- desktop
- laptop
- tablet
- mobile

Global requirements:

- no accidental horizontal overflow
- readable text
- usable controls
- forms stack where needed
- cards resize
- calendar remains usable
- Dashboard remains usable
- Sidebar remains usable
- mobile navigation remains accessible
- nested Pages remain understandable

---

# 60. Accessibility contract

Controls should have:

- visible labels where appropriate
- accessible names for icon-only controls
- keyboard focus states
- logical tab order
- skip-to-content support
- readable contrast
- reduced-motion support
- larger-control support

Examples of accessible labels currently used:

- Reload FocusOS
- Expand sidebar
- Collapse sidebar
- Open menu
- Close menu
- Search Pages
- Previous month
- Next month
- Add event
- Close
- Edit history record
- Delete history record

---

# 61. Exact visible wording inventory

The following are product-controlled strings that reviewers should treat as UI copy, not implementation trivia.

### Global

- Loading…
- FocusOS recovered from an error
- This screen could not be loaded.
- Your data was not intentionally changed. Check your settings or reload the page.
- Reload FocusOS
- Skip to content
- New Page
- Search Pages
- No Pages found.
- Create a Page to add it here.
- Settings
- Sign out

### Pages

- Pages
- Search Pages...
- New Page name...
- Page icon
- Create Page
- Page created ✓
- Unable to create Page.
- Archived Pages
- Archive hides a Page without deleting its data.
- Restore
- Restored [Page] ✓
- Page: [name]
- Child Page: [name]
- This Page is a folder inside its parent. It has its own capabilities, items and history.
- This Page can contain child Pages, like folders inside folders.
- Open Page
- Optional Page description
- Child Pages
- Create folders inside this Page. Each child is a complete Page with its own capabilities, items and history.
- New Page inside “[parent]”...
- Add child
- Child Page created ✓
- Capabilities
- Attach only the behaviors this Page needs. Activity is stored against this Page.
- Visibility & navigation
- Primary navigation
- Show this Page in the main sidebar.
- Pin to Dashboard
- Pinning adds this Page to Dashboard and primary navigation. Unpinning removes the automatic navigation promotion.
- Sidebar order
- Save Page
- Saving…
- Saved
- Move to Trash
- Page saved ✓
- Page and its child Pages moved to Trash.
- Unable to create Child Page.
- Unable to save Page.
- Unable to update Page archive state.
- Unable to move Page to Trash.

### Page overview

- Overview
- History
- Configure
- Page information
- Your configured fields.
- Save
- Saving…
- This field is required.
- Complete the required Page fields before saving.
- This Page is empty. Configure fields or capabilities in Pages.
- Sub-pages
- Build this Page into its own hierarchy.
- New sub-page
- Add
- New item
- Open
- Open item
- Back to Overview
- Page history
- Activity history
- Durable records created by this Page and its capabilities.
- records
- Search history…
- All capabilities
- All statuses
- Reset
- No activity has been recorded for this Page yet.
- History record hidden.
- Undo
- Edit history title
- Hide this history record?
- Open [capability] for this Page.

### Calendar

- Calendar
- Plan, schedule and manage events across your calendar.
- Event
- Previous month
- Today
- Next month
- deadlines
- events
- Sun
- Mon
- Tue
- Wed
- Thu
- Fri
- Sat
- Deadline · [task]
- +[N] more
- Add event
- Edit event
- Event name
- Description (optional)
- Date
- Time
- Repeat
- One time
- Daily
- Weekly
- Monthly
- Page
- General
- Delete
- Cancel
- Save event

### Dashboard

- greeting prefix
- time greeting
- Time
- Date
- Deadlines
- Reminders
- Tasks
- Habits
- Calendar
- Timetable
- Pomodoro
- Exercise
- Statistics
- Today
- Notes
- No notes yet
- Counter
- Manual counter
- Pages
- No Pages are configured for Dashboard visibility.
- Node Capabilities
- No dashboard-visible nodes configured yet.
- Page
- Capability
- Open Page
- Page no longer available.
- Last [N] days
- Current value

### History

- Page history
- Activity history
- Search history…
- All capabilities
- All statuses
- Reset
- Edit
- History record hidden.
- Undo
- Edit history title
- Hide this history record?

---

# 62. Navigation behavior matrix

| Action | Result |
|---|---|
| Click Dashboard | Dashboard |
| Click Pages | Pages manager |
| Click Calendar | Calendar |
| Click Settings | Settings |
| Click logo | Reload current page |
| Click New Page | Pages |
| Click user Page | Page overview |
| Expand Page | Reveal child Pages |
| Collapse Page | Hide child Pages |
| Pin Page | Dashboard + automatic primary navigation |
| Unpin Page | Remove Dashboard pin + automatic promotion |
| Explicitly enable primary navigation | Keep Page in navigation independently |
| Create child Page | New independent Page inside parent |
| Open child Page | Child's own overview |
| Configure Page | Pages editor for that Page |
| Archive Page | Hide without deleting data |
| Trash Page | Move Page and descendants/data to Trash |
| Restore | Return archived/trash data where supported |
| Previous month | Calendar month - 1 |
| Next month | Calendar month + 1 |
| Today | Calendar returns to current month/date |
| Event | Add event modal |
| Edit event | Edit event modal |
| Delete event | Delete event |
| Save event | Persist event |
| Capability checkbox | Attach/remove capability |
| Capability view | Open capability |
| History | Open durable Page activity |
| Edit history | Update history title |
| Hide history | Soft-delete history |
| Undo | Restore hidden history |

---

# 63. What is intentionally removed / retired

These should not silently return:

- visible Workspace product surface
- Page Builder heading at top
- Dashboard breadcrumb `FocusOS > Dashboard`
- Dashboard Customize button
- creation-time Page preset dropdown
- Blank / Focus / Project / Habit / Fitness preset selector
- creation-time Root Page dropdown
- unused Page fields builder
- visible **Page tool** label
- visible **Tools** heading for capability runtime
- bullet-style Page navigation
- logo + “FocusOS” text in expanded sidebar header
- fixed January 2027 calendar
- dashboard widget overlap
- 12-column-only Dashboard limitation

Legacy routes may remain only for redirects/backward compatibility.

---

# 64. Product terminology

Use these terms consistently:

### Page
An organizational unit that can contain capabilities, Nodes/items, activity and child Pages.

### Child Page
A Page nested inside another Page.

### Folder
The mental model for a Page containing other Pages.

### Node
An individual structured object/item belonging to a Page.

### Capability
A behavior attached to a Page or Node.

### Activity
A durable event/record generated by a capability.

### History
The user-facing activity timeline for a Page.

### Dashboard widget
A presentation block on the Dashboard.

### Primary navigation
A Page's presence in the main sidebar.

### Dashboard pin
A Page's presence on the Dashboard.

---

# 65. Current product watchlist

These are areas that require verification whenever the underlying code changes:

- every capability Create → Save → Refresh cycle
- Tasks form submission
- Habits form submission
- Goals form submission
- Workouts form submission
- Measurements form submission
- Focus Session persistence
- Timer persistence
- custom capability persistence
- Dashboard 24-column CSS/rendering
- Dashboard dense packing
- dashboard overlap prevention
- clock styles
- clock zero-padding
- timezone propagation
- accessibility preference defaults
- calendar system rendering
- additional calendar persistence
- Page pin/unpin promotion
- nested Page navigation
- nested Page creation
- recursive Page folders
- archive/trash descendant handling
- history durability after capability disable
- mobile sidebar
- mobile Dashboard
- mobile Calendar
- mobile Page hierarchy

---

# 66. Product change checklist

When requesting a change, use one of:

### Upgrade

`Dashboard → Clock → add [feature].`

### Change

`Pages → Child Pages → change Add child to [behavior].`

### Remove

`Settings → Accessibility → remove High contrast.`

### Rename

`Calendar → Event → rename “Event” to “Appointment”.`

### Move

`Dashboard → Time → move it to the top-left.`

### Fix

`Pages → Tasks → Save works visually but data disappears after refresh.`

### Redesign

`Pages → Page editor → redesign the Child Pages section as a folder browser.`

---

# 67. Final definition of this document

This file is the **product inventory and review map**, not merely a technical sitemap.

When a new UI element, feature, capability, setting, button, modal, field, message, navigation rule or behavior is added to FocusOS, this document should be updated so the product remains reviewable without reading source code.

The goal is:

```
See it here
↓
Point to it
↓
Request change
↓
Implement
↓
Verify
↓
Update this document
```

**Anas is the product/visual reviewer.**

The source code is the implementation.

This document is the human-readable contract between the two.
