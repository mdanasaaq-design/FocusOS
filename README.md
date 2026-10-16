# FocusOS

FocusOS is a customizable personal operating system for organizing life, tracking progress, and building a personal workflow that adapts to the user.

> **FocusOS provides the tools; the user builds their own FocusOS.**

## Project identity

- **Name:** FocusOS
- **Repository:** `mdanasaaq-design/FocusOS`
- **Stack:** React + Vite + Tailwind CSS + Firebase
- **Firebase:** Authentication, Cloud Firestore, Hosting
- **Production:** `https://focusos-7cd08.web.app`
- **Default branch:** `main`

The long-term direction includes **Awwab**, an intelligent assistant layer for planning, memory, voice and automation. Awwab is intentionally separate from the current FocusOS implementation.

## Product philosophy

FocusOS is not a fixed student-only productivity app. It is a personal OS where users decide what their Pages contain and which capabilities they need.

The core rule is:

> **Do not force the user's life into a fixed product category.**

## Current capabilities

- Profile and dynamic greeting
- Configurable language, locale, timezone, date and calendar preferences
- 12-hour / 24-hour live clock with optional seconds
- Gregorian and Hijri calendar support
- Reminders and recurrence
- Custom timetables with duration calculation and conflict validation
- Habit tracking and streaks
- Namaz/prayer tracking
- Pomodoro focus sessions
- Exercise and weight history
- Pages for user-created areas
- Universal Nodes with arbitrary nesting
- Capability configuration and runtime
- Page activity/history
- Dashboard widgets, analytics and configurable layouts
- Settings-based dashboard configuration
- Legacy specialist capabilities retained during architecture consolidation

## Dashboard rules

- Dashboard is a fixed system area.
- The greeting is a top-level heading, not a grid card.
- The configured greeting prefix and time-based greeting are displayed on separate lines.
- The Dashboard itself is not the place for dashboard customization controls.
- Dashboard layout/widget customization is managed through Settings.
- The clock respects the user's configured format and uses two-digit seconds when seconds are enabled.

## Architecture

FocusOS is built around the **Universal Node model**:

1. **Nodes** are user-created objects and support unlimited parent → child nesting.
2. **Capabilities** describe what a Node or Page can do.
3. **Configuration** controls preferences, regional settings, dashboard layout, visibility and system behavior.
4. **Views/components** present information without becoming the underlying data model.
5. **Fixed system areas** are Dashboard, Calendar and Settings.
6. **Pages** are customizable user-created areas.
7. **Legacy feature modules** remain only where needed for compatibility while behavior is consolidated onto the generic foundation.
8. **Awwab** will be added later as an assistant layer over stable FocusOS interfaces.

## Data and safety principles

- Preserve real user history.
- Never silently delete or rewrite user data.
- Avoid automatic migrations without explicit consent.
- Keep hierarchy/progress rules in pure, testable domain modules.
- Do not extend the superseded fixed Study/Work schema.
- Prefer incremental changes with verification before deployment.

## Local development

```bash
npm install
npm run dev
```

Create `.env` from `.env.example`. Never commit secrets.

## Verification

Run the local checks before opening a pull request or deploying:

```bash
npm run lint
npm test
npm run build
```

### Cloud browser smoke test

GitHub Actions runs the workflow in `.github/workflows/production-smoke.yml` on pushes to `main`, by manual dispatch, and weekly. It runs the existing test suite and production build, then launches Chromium with Playwright to smoke-test the deployed homepage.

- View runs: https://github.com/mdanasaaq-design/FocusOS/actions
- Current smoke-test coverage: HTTP response, visible page content, and uncaught page-level JavaScript errors.
- This smoke test does not cover authenticated workflows, Firestore security rules, or data persistence. Those require dedicated end-to-end and emulator tests.
- Keep test credentials in GitHub Actions secrets. Never commit credentials or use real user data for destructive tests.

Check `CURRENT_VERIFICATION.md` for the observed release-verification state and `tasks.md` for outstanding quality work.

Pure domain checks can also be run directly:

```bash
node scripts/test-progress.mjs
node scripts/test-nodeTree.mjs
node scripts/test-nodeValidation.mjs
```

## Firebase deployment

```bash
npm run build
firebase deploy
```

Rules only:

```bash
firebase deploy --only firestore:rules
```

## Repository documentation

Read `AGENTS.md` and `rules.md` before making repository changes. Agent-specific instructions in `CLAUDE.md` supplement these rules and must be reconciled with the current source-of-truth documents.

- `README.md` — project overview, setup, and repository entry points
- `AGENTS.md` — repository-wide workflow, documentation, safety, and completion rules
- `rules.md` — FocusOS product, data, capability, UI, and deployment rules
- `prd.md` — intended product behavior and acceptance criteria
- `architecture.md` — technical contracts, domain boundaries, and data-integrity rules
- `design.md` — visual language, navigation, interaction, responsive, and accessibility rules
- `docs/DECISIONS.md` — durable product and architecture decisions
- `tasks.md` — implementation roadmap and task status
- `CURRENT_VERIFICATION.md` — observed checks, CI evidence, deployment facts, and release gaps
- `PROJECT_STATUS.md` — current working state and next priorities
- `memory.md` — concise durable project context; reconcile it with current product decisions
- `CLAUDE.md` — instructions for Claude implementation sessions
- `CHANGELOG.md` — chronological change history
- `APP_BENCHMARK.md` — product and quality benchmark
- `AUDIT/` — historical audit evidence

## Project structure

```text
src/
├── components/       Shared UI components
├── data/             Firestore data access
├── domain/           Pure business rules
├── lib/              Firebase, auth, dates, preferences and helpers
├── modules/          Capability/dashboard registries
├── pages/            Application screens
└── App.jsx           Routing and application composition

tests/                Automated tests
scripts/              Plain Node verification scripts
e2e/                  End-to-end test area
firestore.rules       Firestore security rules
firebase.json         Firebase configuration
```


## Firebase Web configuration and production deployment

The Firebase Web configuration is embedded into the Vite bundle at build time. Before building for production, populate the local `.env` file with the six `VITE_FIREBASE_*` values from **Firebase Console → Project settings → General → Your apps → Web app configuration**. In particular, `VITE_FIREBASE_API_KEY` must be the valid Web API key for project `focusos-7cd08`; do not use emulator/demo values in a production build.

After correcting the configuration, run the guarded Hosting deployment command. It checks the production Firebase settings, builds the bundle, and then deploys Hosting:

```bash
npm run deploy:hosting
```

Then verify the deployed app with the production smoke workflow. A successful HTTP response is not sufficient: the smoke test must confirm that the sign-in screen or authenticated navigation actually renders.
