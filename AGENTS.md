# FocusOS — Repository Working Rules

These rules apply to every person or agent making changes in this repository. Follow them before planning, editing, testing, committing, or reporting work.

## 1. Product and technical sources of truth

Use each document for one purpose:

- `README.md`: project overview, setup, current high-level capabilities, and entry points.
- `prd.md`: intended product behavior, user-facing requirements, and acceptance criteria.
- `architecture.md`: technical model, ownership boundaries, data contracts, invariants, and migration rules.
- `design.md`: visual language, interaction behavior, navigation, responsive design, and accessibility expectations.
- `tasks.md`: ordered implementation backlog and task status.
- `CURRENT_VERIFICATION.md`: observed checks, CI evidence, deployment facts, known failures, and release gaps.
- `CHANGELOG.md`: meaningful user-visible or developer-relevant changes by release or change set.
- `docs/DECISIONS.md`: durable decisions, rationale, consequences, and superseded decisions.
- `AGENTS.md`: repository-wide working rules.

If a file is absent, create it only when it serves one of these purposes or fills a concrete documentation gap. Avoid duplicate documents that compete to define the same thing.

### Conflict resolution

1. Preserve user-approved product decisions unless the user changes them or evidence shows a safety/correctness issue.
2. `architecture.md` governs technical contracts; `prd.md` governs intended product behavior; `design.md` governs interaction and visual rules.
3. If these documents conflict, do not silently choose whichever is easiest to implement. Record the conflict, reconcile the relevant documents in the same change, and add a decision entry when the choice is durable.
4. Code describes current implementation, not necessarily intended behavior. Never infer that a requirement is implemented just because it is documented or named in code.
5. `CURRENT_VERIFICATION.md` records evidence only; it must never be used as a substitute for requirements or architecture.

## 2. Required workflow

1. Inspect the current branch, recent changes, relevant source files, related tests, and relevant documentation before editing.
2. Identify the user-visible goal, affected contracts, data risks, and acceptance criteria.
3. Make changes in a focused branch or pull request. Do not push directly to `main` unless the user explicitly authorizes direct-to-main changes and repository policy permits it.
4. Implement related work in coherent batches. Avoid unrelated refactors and repeated micro-commits.
5. Add or update tests for behavior changes and regression fixes.
6. Run the most relevant checks, then the full available verification suite for integrated changes.
7. Update all affected Markdown documents in the same change set.
8. Review the diff for accidental scope expansion, secrets, generated files, data loss, broken links, and inconsistent documentation.
9. Report the exact branch/PR/commit and distinguish completed work from unverified work.

Never claim a change was committed, pushed, tested, merged, or deployed unless tool output or repository evidence confirms it.

## 3. Documentation update triggers

Update documentation whenever the change affects its subject:

- Product behavior, user flows, or acceptance criteria → `prd.md`.
- Domain concepts, collection/schema contracts, ownership, lifecycle, permissions, migrations, or invariants → `architecture.md`.
- Navigation, layout, typography, visual tokens, interaction states, responsive behavior, or accessibility → `design.md`.
- Scope, priorities, dependencies, or task completion → `tasks.md`.
- Actual test results, CI status, observed bugs, release/deployment state, or remaining verification gaps → `CURRENT_VERIFICATION.md`.
- Meaningful feature, fix, migration, or developer workflow change → `CHANGELOG.md`.
- A lasting choice with trade-offs or rejected alternatives → `docs/DECISIONS.md`.
- Setup, supported capabilities, or high-level project status changes → `README.md`.

Keep updates narrow and factual. Do not update verification with intended or assumed results. Do not mark a task complete until its stated scope and verification requirement are satisfied. If no document needs changing, that should be an intentional judgment, not an omission.

## 4. Architecture and data safety

- Preserve existing user data, stable IDs, record history, and ownership boundaries.
- Prefer additive, reversible migrations with explicit validation and a recovery plan.
- Never silently delete, duplicate, reassign, or reinterpret records to simplify a UI or schema.
- A record shown in multiple places must remain the same underlying record unless the product explicitly defines a copy operation.
- Keep Page hierarchy and Node hierarchy distinct as specified by `architecture.md`.
- Keep view configuration separate from record data. A view's filters, grouping, layout, and visible fields must not mutate other views or the underlying record.
- Enforce authorization in trusted data-access and Firestore rules; hiding UI controls is not authorization.
- Do not introduce a new collection or abstraction without a concrete domain, query, security, or lifecycle reason.
- Preserve compatibility until replacement behavior and migration paths are verified.
- Never put credentials, private user data, tokens, or secrets in source, Markdown, tests, screenshots, or logs.

## 5. Product and design quality

- Build a coherent product, not a collection of disconnected screens.
- Follow `design.md` tokens and shared components; do not introduce one-off visual styles without a reason.
- Avoid generic "AI dashboard" decoration, gratuitous gradients, excessive cards, meaningless metrics, and motion without functional purpose.
- Prefer clear hierarchy, intentional whitespace, useful information density, responsive behavior, accessible labels, visible focus, keyboard support, and reduced-motion support.
- Include loading, empty, success, error, validation, and destructive-action states where applicable.
- Do not add features merely to increase feature count. Each feature must serve a defined user need and fit the architecture.
- Keep ordinary workflows simple; expose advanced configuration progressively.

## 6. Code and verification

- Follow the existing framework, code conventions, and established abstractions unless the change intentionally improves them.
- Fix root causes rather than weakening tests or suppressing warnings to obtain a green check.
- Add regression coverage for bugs and for data-integrity behavior.
- For Firestore changes, consider owner isolation, unauthenticated access, query constraints, and emulator/rules coverage.
- For lifecycle changes, test nested structures, shared associations, preservation, and ordering of operations.
- For UI changes, check loading/empty/error states, keyboard access, responsive layouts, and browser console errors.
- Use the project's scripts and CI workflow as the authoritative available checks. Record skipped checks explicitly.
- A passing lint, unit suite, build, or homepage smoke test alone is not production sign-off.
- Do not run destructive browser tests against real user data; use dedicated test accounts and disposable test data.

## 7. Completion and reporting

Work is complete only when:

- The requested change is implemented.
- Relevant tests and checks have been run, with failures fixed or clearly reported.
- Affected documentation is reconciled.
- The diff is reviewed for unintended changes and data/security risks.
- The final report identifies the branch/PR/commit and lists verification evidence and remaining limitations.

Use status labels consistently: **Implemented**, **Partial**, **Planned**, **Verified**, and **Blocked**. "Implemented" does not mean "Verified"; "deployed" requires deployment evidence; "production-ready" requires the applicable release sign-off criteria in `CURRENT_VERIFICATION.md`.

## 8. Working style for this project

- Make reasonable engineering decisions without asking the user to approve routine implementation details.
- Ask a question only when a missing decision materially affects product direction, user data, security, cost, or an irreversible action.
- Work in large, coherent phases, but keep changes reviewable and preserve a reliable rollback path.
- Provide concise, evidence-based progress updates. Do not claim background work continues after a response unless an actual supported process has been started.
