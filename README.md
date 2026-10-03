# FocusOS

FocusOS is a private, single-user personal operating system for organizing life, tracking progress, and building a personal workflow that adapts to the user.

> **FocusOS provides the tools; the user builds their own FocusOS.**

The long-term direction is to add **Awwab**, an intelligent assistant layer for planning, memory, voice, and automation. Awwab is not part of the current implementation phase.

## Current stack

- React
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## Current capabilities

- Personal profile and dynamic greeting with configurable language, calendar, timezone, and 24-hour/12-hour clock
- Home dashboard with daily progress
- Gregorian calendar with Hijri dates
- Reminders and recurrence
- Custom timetables with conflict validation
- Habit tracking and streaks
- Namaz/prayer tracking
- Pomodoro sessions
- Exercise and weight history
- Academics and transitional Study/Work functionality, with the Universal Node model as the long-term foundation
- Generic node domain and data-layer foundation for future customizable modules

## Architecture direction

FocusOS is built around the **Universal Node model**.

1. **Nodes** are the fundamental user-created objects and support unlimited parent → child nesting.
2. **Capabilities** describe what a Node can do and attach to Nodes through validated bindings.
3. **Configuration** controls user preferences, regional settings, dashboard layout, capabilities, and other system behavior.
4. **Views/components** present information without becoming the underlying data model.
5. **Fixed system areas** are Dashboard, Calendar, and Settings.
6. **Legacy feature modules** remain only as transitional implementations while their behavior is migrated onto the generic foundation.
7. **Awwab** will be added later as an assistant layer over stable FocusOS application/domain interfaces.

> FocusOS provides the tools; the user builds their own FocusOS.

The architecture source of truth is maintained in `prd.md`, `architecture.md`, `rules.md`, `design.md`, `tasks.md`, and `memory.md`.

## Local development

```bash
npm install
npm run dev
```

Create a local `.env` file from `.env.example` and provide the Firebase web configuration values. Never commit `.env`.

To create a production build:

```bash
npm run build
```

## Verification scripts

The repository includes plain Node-based checks for the pure domain contracts:

```bash
node scripts/test-progress.mjs
node scripts/test-nodeTree.mjs
node scripts/test-nodeValidation.mjs
```

## Firebase deployment

Build the application and deploy the generated `dist` directory using the Firebase configuration in the repository:

```bash
npm run build
firebase deploy
```

Deploy Firestore rules separately when they change:

```bash
firebase deploy --only firestore:rules
```

## Project structure

```text
src/
├── components/       Shared UI components
├── data/             Firestore data access and validation
├── domain/           Pure business rules and hierarchy/progress logic
├── lib/              Firebase, authentication, dates, and feature helpers
├── modules/          FocusOS capability registry
├── pages/            Application pages
└── App.jsx           Application routing and composition

scripts/              Plain Node verification scripts
firestore.rules       Firestore security rules
firebase.json         Firebase Hosting/Firestore configuration
```

## Development principles

- Preserve real user history; do not replace persisted records with temporary UI state.
- Avoid destructive migrations and automatic data transformations without explicit consent.
- Keep hierarchy and progress logic in pure, testable domain modules.
- Do not extend the superseded fixed Study/Work schema; rebuild it on the generic node foundation.
- Make changes incrementally and verify them before deployment.
