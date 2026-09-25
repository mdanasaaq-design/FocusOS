# FocusOS — Product Requirements Document

## 1. Product Vision

FocusOS is a configurable personal operating system. It provides the tools, while the user builds their own system according to their needs, structure, workflows, and preferences.

> FocusOS provides the tools; the user builds their own FocusOS.

FocusOS is designed for a single owner initially. The long-term direction may include Awwab, an intelligent assistant layer, but Awwab is not part of the current implementation scope.

## 2. Product Principles

- The user defines the structure.
- No student-specific, profession-specific, or lifestyle-specific assumptions.
- No mandatory predefined life categories.
- Everything the user creates begins as a Node.
- Nodes support unlimited parent-child nesting.
- Capabilities attach to Nodes.
- Views present information but do not define the underlying data model.
- User data and history must persist reliably.
- Existing data must not be deleted or transformed destructively without explicit consent.
- All major system behavior must be configurable where practical.

## 3. Fixed System Areas

Only these areas are fixed in the product:

1. Dashboard
2. Calendar
3. Settings

All other organizational areas are created and configured by the user.

## 4. Universal Node Model

A Node is the fundamental user-created object in FocusOS.

Each Node may contain:

- Identity: name, icon, color, description
- Status: active, archived, or deleted according to retention rules
- Parent reference
- Child Nodes
- Sort/order information
- Custom fields
- Attached capabilities
- Capability configuration
- Views and presentation preferences
- Visibility settings
- Relationships to other Nodes
- Activity and history
- Created and modified timestamps

Nodes must support unlimited nesting and user-defined hierarchy.

## 5. Capabilities

Capabilities represent behaviors or functions that can be attached to Nodes.

### Built-in capability families

- Productivity: Tasks, Checklists, Notes, Reminders, Timer, Pomodoro, Goals
- Planning: Events, Scheduling, Timetables, Recurring Schedules, Timeline
- Tracking: Checkbox, Counts, Duration, Percentage, Numeric Measurements, Habits, Streaks, Progress
- Organization: Tables, Lists, Tags, Categories, Files, Links
- Analytics and presentation: Progress Indicators, Counters, Statistics, Charts, Calendar Views, Timeline Views, Cards
- Future capabilities: Forms, Automations, Workflows, Dependencies, Calculations, Custom Fields, Integrations, AI

Users should eventually be able to create their own capabilities through a builder.

## 6. Dashboard Requirements

The Dashboard is fixed as a system area, but its content is completely customizable.

Users should eventually be able to:

- Add widgets
- Remove widgets
- Enable or disable widgets
- Move widgets
- Resize widgets
- Reorder widgets
- Configure widget behavior
- Hide or show widgets
- Duplicate widgets
- Collapse widgets
- Create multiple dashboard layouts

Dashboard widgets may display greetings, time, dates, progress, deadlines, tasks, reminders, statistics, charts, timers, notes, counters, calendars, or any configured capability.

## 7. Calendar Requirements

The Calendar must support:

- Standalone events
- Node-linked events
- Configurable primary and secondary calendar systems
- Gregorian, Hijri, and future supported calendars
- Language selection
- Date format selection
- Time format selection
- Time zone selection
- First day of week preference
- Multiple calendar views
- Configurable visibility of Node-linked events

## 8. Greeting and Onboarding

First-login onboarding should guide the user through initial setup instead of assuming a fixed identity or workflow.

Configurable onboarding options include:

- Display name
- Greeting prefix, such as Assalamualaikum, Namaste, or a custom greeting
- Time-based greetings for morning, afternoon, evening, and night
- Custom greeting mode
- Clock visibility and format
- Date visibility and calendar system
- Time zone
- Language and region
- Guided setup of Nodes, capabilities, dashboard, and calendar

The default greeting currently combines:

`Assalamualaikum, Good morning/afternoon/evening/night, [Name]`

The greeting must remain configurable.

## 9. Localization and Accessibility

FocusOS must not assume English, Gregorian dates, a specific region, or a single time format.

Settings should eventually include:

- Application language
- Calendar systems
- Date format
- Time format
- Time zone
- Regional formatting
- Font and interface scale
- Contrast
- Theme
- Density
- Reduced motion
- Keyboard navigation
- Focus indicators
- Larger interaction targets
- Screen-reader-friendly structure
- Notification and sound preferences

## 10. Data and Reliability Requirements

- Persist meaningful user actions in Firestore.
- Do not treat temporary checkbox state as history.
- Preserve real user history.
- Use owner-only access rules.
- Validate data at the domain and persistence boundaries.
- Avoid destructive migrations.
- Keep pure business logic testable outside the UI.

## 11. Current Technical Context

- React
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## 12. Out of Scope for the Current Foundation

- Awwab assistant behavior
- AI chat
- Autonomous planning
- Voice assistant
- Complex automation engine
- Multi-user collaboration
- Uncontrolled runtime plugin execution

These may be considered after the FocusOS foundation is stable.

## 13. Success Criteria

FocusOS succeeds when a user can:

1. Sign in securely.
2. Configure their identity and preferences.
3. Create a custom Node hierarchy.
4. Attach capabilities to Nodes.
5. Configure and view capability data.
6. Customize the Dashboard.
7. Configure calendar and regional settings.
8. Return later without losing meaningful history.
9. Use the system without being forced into predefined categories.
