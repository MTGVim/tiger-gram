# Repository Guidelines

## Project Structure & Module Organization
This repository is implementation-first. `CLAUDE.md` is a living implementation snapshot and must be kept aligned with real code behavior.

When implementing code, use this layout:
- `src/features/nonogram/` Nonogram engine, solver, generator, and related React UI.
- `src/features/sudoku/` Sudoku generator, solver, and difficulty classifier UI.
- `src/components/` shared React components (buttons, modals, layout).
- `src/lib/` shared utilities (rating, streaks, persistence, validation).
- `src/pages/` route-level page components (`Landing`, `Nonogram`, `Sudoku`).
- `src/styles/` Tailwind entry CSS and design tokens.
- `public/` static assets (icons, `concept.png`, `sounds/victory-fanfare.mp3`).
- `tests/` unit/integration tests mirrored by module path.

## Build, Test, and Development Commands
Use React + Tailwind CSS as the default stack. Standardize scripts:
- `yarn install` install dependencies.
- `yarn dev` start local React dev server with hot reload.
- `yarn build` create production build.
- `yarn preview` serve the production build locally.
- `yarn test` run automated tests.
- `yarn lint` run ESLint and formatting checks.

If you add tooling, update this file in the same PR.

## Coding Style & Naming Conventions
- Use TypeScript for app and puzzle logic.
- Indentation: 2 spaces; keep lines readable and avoid deep nesting.
- File names: `kebab-case.ts` for modules, `PascalCase.tsx` for React components.
- Symbols: `camelCase` for variables/functions, `PascalCase` for types/classes, `UPPER_SNAKE_CASE` for constants.
- Tailwind: prefer utility classes in JSX; extract repeated patterns into reusable components instead of long class strings.
- Keep shared color/spacing tokens in Tailwind config; avoid ad-hoc inline styles unless dynamic values are required.
- Prefer pure, deterministic solver functions; isolate side effects to storage/UI boundaries.
- Use `localStorage` through `src/lib/persistence.ts` (current key prefix: `tiger-gram:`).

## Testing Guidelines
- Framework: Vitest + React Testing Library.
- Place tests under `tests/` with mirrored paths, e.g. `tests/features/nonogram/solver.test.ts`.
- For UI components, use `ComponentName.test.tsx` and test behavior over implementation details.
- Add deterministic fixtures for puzzle generation and solver verification.
- Minimum expectation: tests for every solver rule, difficulty classification, and rating/streak updates.

## Commit & Pull Request Guidelines
Git metadata is not present in this workspace, so no historical convention is discoverable. Use Conventional Commits:
- `feat: add nonogram overlap deduction`
- `fix: prevent duplicate streak reset`

PRs should include:
- concise summary of behavior changes,
- linked issue/task,
- test evidence (`yarn test`, lint output),
- UI screenshots/GIFs for visual changes.

## Nonogram Difficulty Size Policy
When implementing or updating nonogram generation, use this board-size mapping:
- `easy`: `5x5`
- `medium`: `10x10`
- `hard`: `15x15`

Keep size-tier selection separate from solver-based logic difficulty classification.

## Difficulty Query Policy (Current Behavior)
- Legacy alias: `difficulty=expert` maps to `hard` (both nonogram/sudoku tier parser).
- Unknown `difficulty` query values currently fall back to `easy`.
