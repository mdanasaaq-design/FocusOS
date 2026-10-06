# FocusOS — Product Direction & Current Alignment

**Updated:** 2026-10-06

## Core product model
FocusOS is a configurable personal operating system. Dashboard, Pages, Calendar and Settings are the primary system surfaces. User-created Pages are first-class navigation items; Workspace is not a product concept. Dashboard customization belongs in Settings.

## Dashboard rules
The top area is reserved for the optional greeting prefix, time-based greeting, and live clock. These are not grid widgets. The grid must not contain standalone FocusOS branding. A 24-hour digital clock uses leading zeroes, for example `01:24:45`.

## Navigation rules
Fixed navigation: Dashboard, Pages, Calendar, Settings. User-created Pages may be promoted to primary navigation and appear as first-class siblings of the fixed areas.

## Page creation
Creation should be visual and simple: name, broad icon/symbol choices, optional color, optional description. The Pages surface is the Page Builder.

## Capability UX contract
### Tasks
Task name → deadline (defaults today) → user-selected priority → optional reminder/repeat → optional estimate in minutes. Do not expose unexplained root-task/internal hierarchy concepts.

### Focus Sessions
Focus should provide configurable focus length, short break, long break, sessions-until-long-break, optional task/context, presets, pause/reset, and saved session history.

### Timer
Use the name **Timer**. Its purpose is to measure an activity and save elapsed time into Page history.

### Habits
Habit name → repeat pattern → reminder time chosen by the user → check-ins and streak history.

### Goals & Metrics
Use only for measurable outcomes: goal name, target, unit, period, progress entries and completion percentage. Explain that target is the destination and unit says what is being measured.

### Measurements
Record a named value, unit and date; show history and change from the previous measurement.

### Workouts
Record exercise, sets, reps, load and duration, then surface useful session/volume history.

### Analytics
Keep Analytics as a useful summary of real Page activity. Do not duplicate source data.

### Remove/reconsider
Routines, generic Tracking, standalone Reminders, duplicate Timetables, and legacy specialist surfaces should not be primary built-in capabilities unless they have a clear user-facing purpose. Compatibility data may remain in storage.

## Calendar
Calendar must visibly combine month navigation, today, scheduled events, open task deadlines, selected-day details, quick event creation/editing, Page context where relevant, and configured calendar/timezone preferences.

## Design principle
FocusOS should feel simpler and more aligned than the earlier fixed productivity app while retaining the generic Page/capability architecture underneath. Do not add abstractions that do not solve a visible user problem.

## Alignment pass
Current work includes greeting/clock separation from the grid, leading-zero clock handling, capability language cleanup, explicit task priority and estimate, clearer Timer language, required habit reminder, visible Calendar day details, and repaired preference/settings source formatting.
