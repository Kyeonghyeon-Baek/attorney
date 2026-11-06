# Repository Guidelines

## Project Structure & Module Organization
「판 뒤집기」 is a Korean courtroom adventure built with Vite and vanilla TypeScript. `src/main.ts` initializes the game; `src/style.css` controls presentation.
- `src/content/`: episode data and script helpers. Episodes 1–2 have `ep1/` and `ep2/` directories; episode 4 uses flat files such as `case-daon.ts`.
- `src/engine/`: script execution, rendering, input, audio, investigation, and saves. Shared command types live in `types.ts`.
- `src/assets/`: artwork and optional recordings; development artwork lives under `ep2/`.
- `tests/`: automated regression tests. `docs/`: story specifications, production notes, and art guidance.
- `dist/`: generated build output; do not edit or commit it.

## Build, Test, and Development Commands
Use Node.js 24, matching deployment CI, and install dependencies with `npm ci`.
- `npm run dev`: start Vite at `http://localhost:5173`.
- `npm run typecheck`: check strict TypeScript without emitting files.
- `npm test`: run `tests/*.test.mjs` with Node’s built-in test runner.
- `npm run build`: typecheck and produce `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run build -- --base=/attorney/`: reproduce the GitHub Pages build.

## Coding Style & Naming Conventions
Follow existing TypeScript: two-space indentation, single quotes, semicolons, camelCase functions/variables, PascalCase types/classes, and uppercase registry constants. Match neighboring filenames. No formatter or linter is configured; unused locals and parameters fail typechecking.

Write player-facing text in Korean and code comments in English. Keep scripts as data in `content/`; new commands require a `Cmd` variant, script helper, and `Game.exec()` handler. Keep scene and testimony IDs unique within each episode.

## Testing Guidelines
Use descriptive `test()` names in `tests/<feature>.test.mjs`, `node:assert`, and existing Vite SSR harness patterns. Cover changed branching, evidence prerequisites, and save/resume behavior. No coverage threshold is configured. Run tests and a build before review.

Manually check affected scenes with `/?ep=2&scene=day1&fast`; scene jumps disable saving. Verify desktop keyboard and mobile landscape controls for UI changes.

## Commit & Pull Request Guidelines
Prefer concise Korean commit titles describing the change, with bullet-list bodies when needed. For PRs, describe affected episodes/scenes, link relevant issues or specifications, report checks and playtesting, and attach screenshots for visual changes. Obtain creator playtesting before committing gameplay changes.

## Content & Release Constraints
Read `README.md` before editing scenes; update `docs/series-bible.md` first when changing story facts. Preserve evidence limits and checkpoint/save compatibility. Episodes 2 and 4 remain development-only until explicitly released; preserve their production import and asset gates.
