# FocusOS — Specialist App Benchmark

**Date:** 2026-10-02  
**Purpose:** Extract reusable product patterns from specialist apps without turning FocusOS into a collection of fixed modules.

## Sources reviewed

- Pomodoro comparisons covering Focus To-Do, Forest, Pomofocus, TickTick, Toggl and similar tools. The recurring differentiators are task association, configurable intervals, distraction resistance, session statistics, and time tracking. 
- Habit-tracker comparisons covering Habitica, Streaks, Loop, Habitify, Productive, HabitKit and others. Common patterns include flexible cadence, streak/adherence history, visual progress, routines, and different approaches to missed days.
- Toggl's current feature documentation. It combines timers, manual time entries, Pomodoro, calendar-linked entries, estimates vs actuals, targets, reports, and multiple work views.
- Current 2026 fitness-tracker research emphasizing activity modes, GPS where relevant, sleep/wellness metrics, recovery/readiness concepts, and long-term trend data.

## What FocusOS should take

| Specialist area | Useful pattern | FocusOS interpretation |
|---|---|---|
| Pomodoro / focus | Session timer + task association + history | **Focus Sessions capability** |
| Time tracking | Timer + manual entries + reports + targets | **Time Tracking capability** |
| Tasks | Priorities + recurrence + subtasks + estimates | **Tasks capability** |
| Habits | Cadence + adherence + streak + trends | **Habits capability** |
| Routines | Ordered steps + timing + repeat rules | **Routines capability** |
| Goals | Target + period + milestones + progress | **Goals/Metrics capability** |
| Fitness | Workout structure + measurements + history | **Workout + Measurements capabilities** |
| Analytics | Cross-filtered history + trends | **Analytics capability** |

## Design decision

FocusOS will **not** copy these apps as separate products. Their useful primitives become composable capabilities attached to user-created Pages.

Examples:

- **Study Page:** Tasks + Focus Sessions + Time Tracking + Goals.
- **Fitness Page:** Workouts + Measurements + Goals + Analytics.
- **Islamic practice Page:** Habits + Routines + Calendar/Reminders + Notes.
- **Project Page:** Tasks + Time Tracking + Deadlines + Notes + Files.

The Page decides the context; capabilities provide the behavior; Dashboard and Calendar provide cross-cutting presentation.

## Product gaps revealed in the current FocusOS build

1. Pomodoro now supports Universal Node linking, but the standalone specialist surface and Page-bound Focus runtime still need product-level consolidation.
2. Habits and Exercise remain useful specialist surfaces while their Page-bound capability runtimes are consolidated and verified.
3. The generic Page capability runtime now contains real capability implementations, but every binding/configuration path still requires end-to-end functional verification.
4. Current Tasks and Timetables are useful feature implementations but still behave as legacy top-level modules.
5. FocusOS needs shared activity/history contracts before advanced analytics can be reliable.

## Priority sequence

1. Capability contracts and shared activity/history model.
2. Focus Sessions + Tasks integration.
3. Habits/Routines + Goals/Metrics.
4. Workout + Measurements.
5. Time Tracking + Analytics.
6. Migrate/retire legacy specialist routes only after verified replacements.

This keeps the product architecture stable while absorbing the strongest patterns from specialist apps.
