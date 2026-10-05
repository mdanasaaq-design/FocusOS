# FocusOS — Complete Site Map & Product Reference

> This is the visual/product reference for reviewing FocusOS without opening the code.
> Use it to point out corrections by location, for example:
> "Dashboard → Clock: make analog larger."
> "Pages → Tasks: Add Task does nothing."
> "Settings → Accessibility: remove High Contrast."

## Status
- ✅ Intended / implemented
- ⚠️ Needs verification
- ❌ Known problem
- 🧩 Planned / optional

---

# 1. Product Architecture

    FocusOS
    ├── App Shell
    │   ├── Sidebar
    │   ├── Main Content
    │   └── Theme / Preferences
    │
    ├── Dashboard
    │   ├── Greeting
    │   ├── Clock
    │   ├── System widgets
    │   ├── Page widgets
    │   ├── Node widgets
    │   └── Analytics widgets
    │
    ├── Pages
    │   ├── Page creation
    │   ├── Page configuration
    │   ├── Capabilities
    │   ├── Nodes / Items
    │   ├── Child Pages
    │   └── History
    │
    ├── Calendar
    │   ├── Month view
    │   ├── Events
    │   ├── Deadlines
    │   └── Calendar systems
    │
    └── Settings
        ├── Language
        ├── Regional format
        ├── Timezone
        ├── Clock
        ├── Calendars
        ├── Greeting
        ├── Dashboard
        └── Accessibility

Core product flow:

    Page
      ↓
    Capability
      ↓
    User activity
      ↓
    Firebase persistence
      ↓
    History
      ↓
    Dashboard / Analytics

---

# 2. Global App Shell

## Sidebar

Primary navigation:

1. Dashboard
2. Pages
3. Calendar
4. User-created / promoted Pages
5. Settings

Rules:
- Expanded sidebar header shows the logo only.
- Do not show "FocusOS" next to the logo.
- User Pages promoted to primary navigation look like normal nav items.
- A Page pinned to Dashboard automatically becomes primary navigation.
- Unpinning does not remove it from primary navigation.
- Active Page gets active navigation styling.
- Sidebar scrolls when many Pages exist.
- No bullet-list appearance for Page navigation.

Legacy routes:
- /workspace → /pages
- /workspace/node/:nodeId → /pages/node/:nodeId

Workspace is retired as a visible product surface.

---

# 3. Dashboard

## Purpose
The Dashboard is the user's overview / command center.

## Top area

Greeting has two separate pieces:
1. Configurable greeting prefix.
2. Time-based greeting.

Default greeting:
"Assalamualaikum warahmatullahi wabarakatuhu"

The greeting is NOT a grid card.

Remove:
- FocusOS > Dashboard breadcrumb
- Customize Dashboard button from the normal Dashboard

## Dashboard grid

Rules:
- Widgets automatically arrange according to size/content.
- Dense packing in normal view.
- Cards must never overlap.
- Mobile collapses to a usable single-column layout.
- Dashboard supports up to 24 columns.
- Widgets have width/height spans.

Current widget registry:

| Widget | Purpose | Type |
|---|---|---|
| Time | Current clock | System |
| Date | Current date/calendar | System |
| Deadlines | Upcoming deadlines | Capability |
| Reminders | Upcoming reminders | Capability |
| Tasks | Current tasks | Capability |
| Habits | Habit progress/streaks | Capability |
| Calendar | Calendar information/events | Capability |
| Timetable | Schedule/progress | Capability |
| Pomodoro | Focus information | Capability |
| Exercise | Exercise progress | Capability |
| Statistics | Selected statistics | Presentation |
| Notes | Selected notes | Capability |
| Counter | Configurable counter | Presentation |
| Progress | Configurable progress | Presentation |
| Pie Chart | Parts of a whole | Analysis |
| Donut Chart | Parts + total | Analysis |
| Bar Chart | Compare values | Analysis |
| Line Chart | Trends | Analysis |
| Area Chart | Trend volume | Analysis |
| KPI | Important value | Analysis |
| Progress Chart | Target completion | Analysis |
| Analysis Table | Compact analysis | Analysis |
| Heatmap | Activity density | Analysis |
| Node Capabilities | Node capability summary | Presentation |
| Pages | Dashboard-visible Pages | Presentation |
| Page Capability | Live Page capability | Page capability |

## Clock
Clock is a separate Dashboard grid card.

Styles:
- Digital
- Analog
- Minimal
- Flip
- Binary

Settings:
- 12-hour / 24-hour
- Seconds on/off
- Device timezone or selected timezone

---

# 4. Pages

## Purpose
Pages are the main organizational layer.

Examples:
- Personal
- UPSC
- College
- Fitness
- Finance
- Projects
- Any user-created Page

Structure:

    Page
    ├── Capabilities
    ├── Activity / History
    ├── Nodes / Items
    └── Child Pages
        ├── Capabilities
        ├── Activity
        └── Nodes

## Create Page

Only useful fields:
- Icon
- Name
- Create Page

Removed:
- Preset dropdown
- Blank / Focus / Project / Habit / Fitness presets
- Root Page selector during creation
- Page fields builder
- Page Builder title at the top

New Pages start clean.

## Page icons
Use the same Lucide-style icon family as Dashboard / Pages / Calendar.

Available examples:
Home, Check, Clock, Star, Heart, Sun, Sparkles, Target, Fitness, Calendar, Briefcase, Book, Rocket, Brain, Wallet, Music, Tools, Palette.

---

# 5. Page Configuration

When editing a Page:

## Identity
- Icon
- Name
- Color
- Description

## Capabilities
Current built-in capabilities:
1. Tasks
2. Focus Sessions
3. Timer
4. Habits
5. Goals
6. Workouts
7. Measurements
8. Analytics

## Visibility & Navigation
- Show Page in primary navigation
- Pin Page to Dashboard
- Show child Pages

Rule:

    Pin to Dashboard
          ↓
    Automatically becomes
    primary navigation

Unpinning does not remove it from primary navigation.

## Child Pages

Child creation is contextual while editing a Page.

Example:

    Personal
    ├── Health
    ├── Finance
    └── Goals

Editor should show:
"Create a Page inside Personal."
- New child Page name
- Add child

No unnecessary global Root Page dropdown.

---

# 6. Page View

Top navigation:

    Overview | Enabled capabilities | History

Only capabilities actually attached to the Page appear.

## Overview
Can contain:
- Page information, if fields exist
- Capability cards
- Sub-pages
- Child items / Nodes

## History
History supports:
- Search
- Capability filter
- Status filter
- Edit history title
- Hide/delete record
- Undo deletion

History should remain even if a capability is later disabled.

---

# 7. Capability Contract

A capability is not complete just because its UI exists.

Required:

    UI
      +
    Interaction
      +
    Firebase write
      +
    Real-time/readback
      +
    Refresh persistence
      +
    Error handling
      =
    WORKING FEATURE

Every capability should follow:

    Create
      ↓
    Save to Firebase
      ↓
    UI updates
      ↓
    Refresh
      ↓
    Record still exists
      ↓
    Edit / Complete
      ↓
    History

---

# 8. Tasks

Purpose:
Create, prioritize, schedule and complete tasks.

UI:
- Task name
- Deadline
- Priority
- Reminder / recurrence
- Add Task
- Task list
- Complete task

Priority:
- Low
- Normal
- High

Recurrence:
- None
- Daily
- Weekly
- Monthly

Lifecycle:

    Create
      ↓
    Firebase
      ↓
    Open task
      ↓
    Complete
      ↓
    Completion history

---

# 9. Focus Sessions

Purpose:
Structured focus/break workflow.

Example:

    Focus 25 min
        ↓
    Break 5 min
        ↓
    Focus 25 min
        ↓
    Completed session

Configuration:
- Focus minutes
- Break minutes

Saved data should include:
- Page
- Capability
- Duration
- Date
- Status
- Session metadata

---

# 10. Timer

Purpose:
General-purpose time tracking.

Example:

    Start
      ↓
    01:12:34
      ↓
    Stop
      ↓
    Save elapsed minutes

Timer is not required to have focus/break cycles.

---

# 11. Focus Sessions vs Pomodoro vs Timer

| Feature | Focus Sessions | Pomodoro | Timer |
|---|---|---|---|
| General timer | Yes | Yes | Yes |
| Focus/break cycle | Yes | Yes | No |
| Traditional 25/5 | Configurable | Primary concept | No |
| Manual duration | Possible | Less important | Yes |
| Session history | Yes | Yes | Yes |
| General activity tracking | Limited | Limited | Primary |

Recommended product direction:
Pomodoro should eventually be a mode/workflow of Focus Sessions instead of three confusingly similar systems.

---

# 12. Habits

Purpose:
Create recurring habits, track completion and calculate streaks.

UI:
- Habit name
- Cadence
- Reminder time
- Add Habit
- Completion/check button
- Streak

Cadence:
- Daily
- Weekly
- Monthly

Lifecycle:

    Create Habit
       ↓
    Firebase
       ↓
    Habit appears
       ↓
    Check off
       ↓
    Completion activity
       ↓
    Streak recalculates
       ↓
    History

Saved data:
- Habit definition
- Schedule
- Completion records
- Streak
- Dates
- Page association

---

# 13. Goals

Purpose:
Define measurable targets and log progress.

UI:
- Goal name
- Target
- Current progress
- Progress entry
- Completion state

Saved:
- Goal definition
- Target
- Current value
- Unit
- Date
- Progress history

---

# 14. Workouts

Purpose:
Record exercise sessions.

Data:
- Exercise
- Sets
- Reps
- Load
- Duration
- Date
- Page

Flow:

    Workout
      ↓
    Save
      ↓
    History
      ↓
    Analytics

---

# 15. Measurements

Purpose:
Record dated measurements.

Examples:
- Weight
- Waist
- Body measurements
- Other numeric measurements

Data:
- Value
- Unit
- Date
- Page
- History

---

# 16. Analytics

Purpose:
Turn real saved activity into summaries and trends.

Inputs can include:
- Tasks
- Habits
- Focus minutes
- Timer minutes
- Workouts
- Measurements
- Goals
- Page trackers
- Deadlines

Analysis types:
- Pie chart
- Donut chart
- Bar chart
- Line chart
- Area chart
- KPI
- Progress chart
- Table
- Heatmap

Rule:
Analytics must use real saved activity, not fake/demo data.

---

# 17. Nodes

Nodes are individual structured items attached to Pages.

    Page
      ↓
    Node
      ↓
    Node capabilities
      ↓
    Node activity

Examples:
- Project → Project Node
- Subject → Subject Node
- Personal → individual tracking Node

Node capabilities can be exposed through Dashboard widgets.

---

# 18. Dashboard Builder

Functions:
- Add widget
- Remove widget
- Duplicate widget
- Configure widget
- Select Node
- Select capability
- Configure Page capability
- Resize/rearrange
- Save dashboard layout

Important:
The capability selector should show only capabilities actually attached to the selected Node.

---

# 19. Calendar

Purpose:
Normal calendar-app behavior.

Main UI:
- Month view
- Previous month
- Today
- Next month
- Current month/year
- Date selection
- Event creation

Event functions:
- Create
- Edit
- Delete
- Date
- Repeat
- Page association

Repeat:
- Never
- Daily
- Weekly
- Monthly

Responsive:
- 7 columns
- Smaller cells on mobile
- Wrapped controls
- No horizontal overflow

---

# 20. Calendar Systems

Primary calendar options include:
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
- Can be enabled alongside primary.

Additional calendars:
- Users can add additional calendar definitions.

---

# 21. Settings

## Language
Current broad list includes:
English, Arabic, Bengali, German, Spanish, Persian, French, Gujarati, Hebrew, Hindi, Indonesian, Italian, Japanese, Kannada, Korean, Malayalam, Marathi, Nepali, Dutch, Punjabi, Polish, Portuguese, Romanian, Russian, Sinhala, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Chinese.

Default:

    Device language
        ↓
    Supported → use it
    Unsupported → English

## Regional format
Controls locale / regional formatting.

## Timezone
Default is detected device timezone.

Examples:
- Asia/Kolkata
- Asia/Dubai
- Asia/Riyadh
- Europe/London
- America/New_York
- America/Los_Angeles
- Asia/Tokyo
- Australia/Sydney

## Clock
- Digital
- Analog
- Minimal
- Flip
- Binary
- 12h / 24h
- Seconds on/off
- Enabled/disabled

## Greeting
- Show greeting
- Greeting prefix
- Include display name
- Hide display name

## Calendars
- Primary
- Secondary
- Show secondary
- Additional calendars

## Accessibility
- Interface size: Normal / Large / Extra large
- Interface density: Compact / Comfortable / Spacious
- High contrast
- Reduce motion
- Larger controls

---

# 22. Firebase / Persistence

User data is organized under:

    users/
    └── {uid}/
        ├── pages/
        ├── activity/
        ├── nodes/
        ├── configuration/
        └── other feature data

Capability activity is stored under:

    users/{uid}/activity/{activityId}

Important activity fields:
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

Firestore rules:
A signed-in user can only access their own users/{uid} subtree.

---

# 23. Responsive Requirements

Every surface must work on:
- Desktop
- Laptop
- Tablet
- Mobile

Rules:
- No unwanted horizontal scrolling.
- Forms stack on small screens.
- Cards resize.
- Calendar remains usable.
- Sidebar remains usable.
- Dashboard becomes one column where appropriate.

---

# 24. Site Navigation Map

    Dashboard
    ├── Greeting
    ├── Clock
    ├── Widgets
    └── Dashboard Builder

    Pages
    ├── Page list
    ├── Create Page
    └── Edit Page
        ├── Identity
        ├── Capabilities
        ├── Visibility & Navigation
        └── Child Pages

    Open Page
    ├── Overview
    ├── Tasks
    ├── Focus Sessions
    ├── Timer
    ├── Habits
    ├── Goals
    ├── Workouts
    ├── Measurements
    ├── Analytics
    └── History

    Calendar
    ├── Month
    ├── Date
    └── Event

    Settings
    ├── Language
    ├── Region
    ├── Timezone
    ├── Clock
    ├── Calendars
    ├── Greeting
    ├── Dashboard
    └── Accessibility

---

# 25. User Review Checklist

## Global
- [ ] Sidebar
- [ ] Navigation
- [ ] Icons
- [ ] Mobile
- [ ] Typography
- [ ] Spacing
- [ ] Buttons
- [ ] Empty states
- [ ] Error messages

## Dashboard
- [ ] Greeting
- [ ] Time greeting
- [ ] Clock
- [ ] Clock style
- [ ] Date
- [ ] Deadlines
- [ ] Tasks
- [ ] Habits
- [ ] Pages
- [ ] Widget sizing
- [ ] Auto-arrangement
- [ ] No overlap
- [ ] Dashboard Builder
- [ ] 24-column grid
- [ ] Mobile layout

## Pages
- [ ] Create Page
- [ ] Icons
- [ ] Name
- [ ] Description
- [ ] Capabilities
- [ ] Visibility
- [ ] Dashboard pin
- [ ] Primary navigation
- [ ] Child Pages
- [ ] Overview
- [ ] History
- [ ] Nodes

## Capabilities
- [ ] Tasks
- [ ] Focus Sessions
- [ ] Timer
- [ ] Habits
- [ ] Goals
- [ ] Workouts
- [ ] Measurements
- [ ] Analytics
- [ ] Create
- [ ] Save
- [ ] Edit
- [ ] Complete
- [ ] Delete/archive
- [ ] History
- [ ] Refresh persistence

## Calendar
- [ ] Month view
- [ ] Previous
- [ ] Today
- [ ] Next
- [ ] Create event
- [ ] Edit event
- [ ] Delete event
- [ ] Recurrence
- [ ] Page association
- [ ] Mobile layout
- [ ] Primary calendar
- [ ] Secondary calendar

## Settings
- [ ] Language
- [ ] Regional format
- [ ] Timezone
- [ ] Clock
- [ ] Greeting
- [ ] Calendars
- [ ] Dashboard
- [ ] Accessibility
- [ ] Refresh persistence

---

# 26. How Anas Should Report Corrections

No code inspection is needed.

Use:

    Location → What you see → What you want

Examples:

    Pages → Tasks
    Problem: Add Task does nothing.
    Expected: Task appears immediately and remains after refresh.

    Dashboard → Clock
    Problem: Analog clock is too small.
    Expected: Make it 2x larger.

    Settings → Language
    Problem: Telugu is missing.
    Expected: Add Telugu.

Or simply:

    Pages → Habits: nothing saves.

The implementation, persistence, testing and GitHub work can then be handled from that correction.

---

# 27. Current Verification Watchlist

These are items that should be visually/functionally verified rather than assumed correct:

- Capability persistence after the latest form-submit fix.
- Dashboard 24-column rendering.
- Accessibility preference defaults/normalization.
- Analog / Flip / Binary clock behavior.
- Full calendar preference rendering.
- Latest Dashboard grid overlap behavior.
- End-to-end persistence across every built-in capability.

The product should be judged by what the user sees and what happens after clicking, not merely by whether code exists.

---

# 28. Product Definition

A FocusOS feature is complete only when:

    VISIBLE
      +
    INTERACTIVE
      +
    SAVED
      +
    READ BACK
      +
    SURVIVES REFRESH
      +
    ERROR HANDLED
      +
    RESPONSIVE
      =
    COMPLETE

You are the visual/product reviewer.

Inspect the actual application and this document together.

Report corrections by:

    LOCATION
    WHAT IS WRONG
    EXPECTED RESULT

FocusOS can then be iteratively corrected until the entire product matches the intended design.
