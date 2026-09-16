# FocusOS — Product & Architecture Blueprint

**Status:** Product direction agreed; implementation blueprint for future work

## 1. Product definition

FocusOS is a user-configurable personal operating system. It does not prescribe how a person should organize life, work, study, health, projects, or any other area.

> **FocusOS provides the tools; the user builds their own FocusOS.**

The system adapts to the user rather than forcing the user into predefined categories.

A future Awwab assistant layer may operate on top of FocusOS, but Awwab is not part of the current FocusOS implementation scope.

## 2. Fixed system areas

Only three primary areas are fixed by FocusOS:

1. **Dashboard** — a completely user-configurable control surface.
2. **Calendar** — a universal calendar system that can display standalone events and node-related events.
3. **Settings** — the system builder and configuration center.

Everything else is configurable or user-created.

## 3. Universal node principle

**Everything the user creates starts as a Node.**

A node does not have a predefined semantic type. A user may call a node `Timetable`, `Gym`, `College`, `Business`, `Quran`, `Travel`, `Finance`, `Project`, or anything else.

FocusOS must ask what the user wants a node to contain and do, rather than asking the user to choose from hard-coded life categories.

### Node foundation

Every node can support:

- identity: name, icon, color, description
- unlimited parent → child hierarchy
- ordering and movement
- custom fields
- capabilities
- capability configuration
- views/presentation choices
- visibility controls
- relationships to other nodes or records
- persistent history/activity
- archive/restore lifecycle

Nodes may contain zero, one, or many capabilities.

## 4. Hierarchy

The hierarchy is user-defined and has no fixed depth limit.

Example:

```text
Personal
├── Travel
│   └── Japan Trip
│       ├── Flights
│       ├── Hotels
│       └── Places
└── Projects
    └── Website
        ├── Design
        ├── Development
        └── Launch
```

The same mechanism must support any other structure without special-case domain code.

## 5. Capabilities

Capabilities are reusable functions that can be attached to nodes. They are separate from navigation modules and separate from the node hierarchy.

### Built-in capability families

**Productivity**
- Tasks
- Checklists
- Notes
- Reminders
- Timer
- Pomodoro
- Goals

**Planning**
- Calendar/events
- Timetables
- Scheduling
- Recurring schedules
- Timeline

**Tracking**
- Checkbox tracking
- Counts
- Duration
- Percentage
- Numeric measurements
- Habits/streaks
- Progress

**Organization**
- Tables
- Lists
- Tags
- Categories
- Files
- Links/attachments

**Analytics and presentation**
- Progress indicators
- Counters
- Statistics
- Charts
- Calendar views
- Timeline views
- Cards

Additional built-in capabilities can be added over time.

### User-created capabilities

The long-term architecture must allow users to create custom capabilities without requiring FocusOS to hard-code every possible use case.

Example: a user can create a `Water Intake` capability with custom fields, targets, calculations, reminders, progress and Dashboard presentation.

Built-in and user-created capabilities should use the same underlying extensibility model wherever practical.

## 6. Custom fields

Nodes and capabilities must eventually support user-defined fields.

Initial universal field types should include, as appropriate:

- text
- number
- checkbox
- date
- time
- duration
- percentage
- dropdown/select
- tags
- URL
- file/attachment

The field system must be extensible so future field types do not require redesigning the node model.

## 7. Views and presentation

Data and behavior must be separated from presentation.

A node/capability should be able to expose information through reusable views such as:

- list
- table
- grid
- cards
- calendar
- timeline
- progress bar
- counter
- chart

A presentation component should consume a data source rather than being hard-coded for a particular domain.

For example, a progress bar can represent exam completion, workout progress, savings, reading progress, project completion, or timetable completion.

## 8. Dashboard

Dashboard is fixed as a system area, but its contents are entirely user-defined.

Users can create multiple dashboards, for example:

```text
Dashboard
├── Main
├── Study
├── Work
├── Health
└── Custom
```

Each dashboard may contain any components the user chooses, including:

- greeting
- progress bars
- deadlines
- important tasks
- today's tasks
- upcoming events
- timers
- Pomodoro
- habits
- goals
- statistics
- charts
- timetables
- notes
- counters
- calendar views
- custom components

Users should eventually be able to add, remove, move, resize, reorder, configure, hide/show, duplicate and collapse Dashboard components.

### Greeting

Greeting is a configurable Dashboard component, not a hard-coded FocusOS identity.

A user may choose a custom greeting such as:

> **Assalamualaikum warahmatullahi wabarkatahu**

Other users may choose another greeting or disable the greeting entirely.

## 9. Sidebar

The Sidebar is a presentation/navigation surface, not a source of product assumptions.

Users decide what user-created nodes or system capabilities should appear there.

Creating a node must not automatically mean that it appears in the Sidebar.

## 10. Calendar

Calendar is one of the fixed system areas, but its behavior and presentation are configurable.

It must support:

- standalone events not attached to nodes
- events associated with nodes/capabilities
- multiple calendar views
- user-selected calendar systems where supported
- primary and secondary calendar display
- language/localization
- date format
- time format
- time zone
- first day of week

Example configuration:

```text
Primary calendar: Hijri
Secondary calendar: Gregorian
Language: English
Time zone: Asia/Kolkata
Time format: 12-hour
```

Another user may choose a different calendar system, language, time zone or format.

## 11. Localization and regional settings

FocusOS must not assume English, Gregorian dates, a particular time zone, or a particular regional convention.

Settings should eventually control:

- application language
- calendar system
- primary/secondary calendar
- date format
- time format
- time zone
- week-start preference
- regional formatting

The selected language should apply to the application interface, not only Calendar.

## 12. Accessibility

Accessibility is a first-class system configuration area.

The long-term accessibility system should cover:

**Visual**
- font/UI scale
- contrast preferences
- theme
- density/readability options

**Motion**
- reduced motion
- reduced transitions/effects

**Interaction**
- keyboard navigation
- visible focus indicators
- larger interaction targets
- shortcut customization

**Reading**
- readable typography options where technically supported
- line/text spacing
- screen-reader-friendly structure

Accessibility settings should be understandable to ordinary users and not require technical knowledge.

## 13. Settings as the system builder

Settings is not merely a preferences page. It is the configuration center through which users construct their FocusOS.

Conceptual areas:

```text
Settings
├── General
├── Appearance
├── Language & Region
├── Calendar & Time
├── Accessibility
├── Dashboard
├── Sidebar
├── Capabilities
├── Nodes / Builder
├── Notifications
├── Data & Privacy
└── Account
```

Workspace/hierarchy management and system configuration must remain conceptually separate:

- **Workspace:** organize the node hierarchy.
- **Settings:** configure the system, capabilities and node behavior.

## 14. Builder model

The long-term Node Builder should allow a user to:

1. Create a node.
2. Define identity.
3. Build its hierarchy.
4. Add custom fields.
5. Add built-in capabilities.
6. Configure each capability.
7. Configure views/presentation.
8. Configure visibility.
9. Configure Dashboard exposure.
10. Save and continue editing later.

This should eventually become an editable configuration environment rather than a rigid one-time wizard.

## 15. Separation of concerns

FocusOS should maintain these distinctions:

```text
Node
  = what the user organizes

Capability
  = what a node can do

Configuration
  = how the user wants it to behave

View / Component
  = how information is presented

System Module
  = what FocusOS itself exposes as navigation/system infrastructure
```

These concepts must not be collapsed into one model.

## 16. What must not be hard-coded

The following must not become mandatory product assumptions:

- Study
- Health
- Finance
- Work
- College
- Personal
- Fitness
- Timetable
- Quran
- Business
- Any other life category
- English language
- Gregorian calendar
- A particular time zone
- A particular greeting
- A fixed Dashboard layout
- A fixed Sidebar layout
- A fixed set of user-created nodes

These may exist as built-in examples/templates later, but they must never be required by the core architecture.

## 17. Data philosophy

FocusOS must preserve real persistent user history.

Principles:

- User-created configuration is data.
- User activity is persistent data.
- History should not disappear because a UI component is removed.
- Destructive migrations require explicit consent.
- Domain rules should remain testable and separated from UI.
- The data model must be extensible rather than optimized around today's features.

## 18. Current implementation vs target direction

The existing repository already contains a useful foundation: a generic node hierarchy, node capabilities, configurable modules, Settings-based node capability assignment, a Workspace route, and Firestore user-scoped persistence. The README currently describes the generic node foundation and configuration direction. fileciteturn171file0

The current capability registry already separates node capabilities from navigation modules and includes reusable capabilities such as Tasks, Habits, Notes, Calendar, Reminders, Tracking, Timetables, Pomodoro, Exercise, Study/Work and Files. fileciteturn172file0

However, the target architecture is broader than the current implementation. Future work must progressively move from a feature-specific application toward the universal builder model described in this document.

## 19. Development rule from this blueprint

Before implementing a major feature, ask:

1. Is this truly a fixed FocusOS system feature?
2. If not, should it be a Node?
3. If it is behavior attached to a Node, should it be a Capability?
4. If it changes how something behaves, is it Configuration?
5. If it only changes presentation, is it a View/Component?
6. Can another user configure the same system differently without code changes?
7. Does the design accidentally assume a life category, language, calendar, culture or workflow?

If the answer to the last two questions is no, the design should be reconsidered before implementation.

## 20. Roadmap direction

The roadmap should proceed in architectural layers rather than isolated feature additions:

### Foundation
- stabilize universal Node model
- define extensible configuration contracts
- separate system modules from node capabilities
- define custom fields
- define reusable view/component contracts

### Builder
- full Node Builder
- capability configuration
- custom fields
- visibility configuration
- node-level views

### Dashboard
- dashboard data model
- multiple dashboards
- component library
- drag/reorder/resize/configure
- source-driven components

### Calendar and localization
- standalone events
- node-linked events
- calendar abstraction
- locale/language system
- time zone/date/time preferences

### Accessibility
- system accessibility preferences
- keyboard navigation
- reduced motion
- scaling/contrast/readability

### Extensibility
- user-created capabilities
- user-created views/components
- formulas/calculations
- workflows/automation
- integrations

### AI layer later
- Awwab can eventually operate over the stable FocusOS data/configuration model.

## 21. Product north star

> **FocusOS is not a collection of predefined productivity apps. It is a configurable operating environment in which users build their own system from nodes, capabilities, data, views and rules.**

The product should become more flexible as it grows, not more opinionated.
