# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

「판 뒤집기」 is a Korean courtroom adventure game (Ace Attorney style) built with Vite and vanilla TypeScript: no framework, and no runtime dependencies besides two font packages. Player-facing text, docs and commit messages are in Korean. Code comments are in English.

**README.md (Korean) is the reference for the script DSL, every staging command, URL parameters, controls and save behaviour.** Read it before writing or editing scenes. This file covers what the README does not.

## Commands

```bash
npm run dev        # Vite on :5173 (.claude/launch.json has it as "pan-dwijibgi" for preview_start)
npm run typecheck  # tsc --noEmit: the only automated check (no tests, no linter)
npm run build      # typecheck + vite build → dist/
```

- The tsconfig is `strict` with `noUnusedLocals` and `noUnusedParameters`, so a leftover import fails the build.
- To check a scene, open the dev server at a URL such as `/?ep=1&scene=cross3&fast`. Jumping with `?scene=` hands over all evidence (`record.ownAll()`) and turns saving off. `?fast` prints text instantly, and `?spots` outlines investigation hotspots.
- **Scene ids repeat across episodes.** 1화 and 4화 both have `cross1`–`cross4`, `recess`, `breakdown`, `verdict` and `epilogue`. With `?scene=` alone, `main.ts` picks the first episode in `EPISODES` that has the scene, which is 1화. For 4화, always add `?ep=4`.

## Architecture

The code splits into content and engine. `src/content` is plain data. `src/engine` interprets it. `main.ts` builds a `Game` from `EPISODES` (`content/episodes.ts`); `Game.start()` runs the title screen, the episode list (사건 기록부), the save slot and then the scene loop.

**Scripts are data.** A scene is a `Script`, which is a `Cmd[]`. `Cmd` is a discriminated union in `engine/types.ts`, and `content/script.ts` has the helper constructors (`say`, `present`, `when`, …) so content reads like a screenplay. `Game.exec()` in `engine/game.ts` is one switch over `cmd.t`. A `goto` sets `this.next` and returns the `STOP` sentinel, which unwinds every nested `run()` (inside a cross-examination, `present`, `ask` or `if`) back to the scene loop in `start()`. To add a command:
1. add a variant to `Cmd`,
2. add a helper in `script.ts`,
3. add a case in `Game.exec`.

**Type unions are the registries.** `CharId`, `SfxName`, `BgmName` and `AmbienceName` in `types.ts` list everything that exists. `CHARACTERS` (`content/characters.ts`) and `TRACKS` (`engine/music.ts`) are `Record`s over those unions, so after adding a name the compiler points at what is missing. All sound is synthesized with WebAudio in `audio.ts` and `music.ts`, except BGM tracks with a recording in `assets/music/<BgmName>.m4a`: those play the file (intro once, then `loopStart`..`loopEnd` from `RECORDINGS` in `music.ts`) and fall back to the synth when the file is missing. None ship today: Suno covers were tried (orchestral, GBA-style, small band) and the creator preferred the synth tracks. The working files (reference WAVs, downloads, loop tools) live in the git-ignored `music-work/`. Music is written in a text step-sequencer format, described at the top of `music.ts`.

**An episode is one `CaseData` object** (defined in `game.ts`). It holds the evidence, profiles, testimonies, investigation locations, scenes, `sceneLabels` (names shown on the continue button), gauge start and wrong-answer penalty, and fallback reactions. Its scenes and testimonies are spread together from several files (`...OPENING_SCENES, ...TRIAL_SCENES`), so **a duplicate key silently overwrites another**. Keep ids unique within an episode.
- 1화 uses the newer layout in `content/ep1/`: `records.ts`, `opening.ts`, `trial.ts`, `tape.ts`, `finale.ts`, `recaps.ts` (the 「이번 공방」 pages) and `case.ts`.
- 4화 uses the older flat files: `case-daon.ts`, `investigation.ts`, `chapter-haeun.ts` and `chapter-day3.ts`.
- Unfinished episodes are `{ locked: true, … }` entries in `episodes.ts`.

**Game state** is held on `Game`:
- `flags` and the court record's owned ids. `has(id)` checks both, so `when()`, a topic's `requires` and `investigate()` goals accept either evidence ids or flag names.
- `memo()` lines, stored as flags prefixed `memo:` so they persist in saves.
- `revealed`, the statement ids made visible by `reveal()`.
- Court-record edits: `revise()` and `annotate()` are stored as flags (`rev:<id>|…`, `ann:<id>|…`) and re-applied on resume. Use `annotate` for a finding made in court, so the original record text never changes.
- `presented`, the last evidence presented, which `ifPresented()` checks when several answers are accepted.
- The verdict gauge. In 4화 it works as the player's health. In 1화 (`chances` set on the case) it is a narrative value set only by `predict(value, reason, status)`, which overwrites rather than adds, and wrong answers spend separate review chances (`Game.chances`) instead.
- The 1화 「이번 공방」 page in the court record (`recap|<json>`, set by `recap()`; checkpoints use `recapFlag()`).
- Hint stages read (`hint:<key>|n`), evidence seen state (`seen:<id>|n`) and the photo-mark switch (`photomark:<set>`) are flags too.

**Cross-examination** runs in `Game.runCross`.
- The visible statements are recomputed on every step from `hidden`, `replaces` and `revealed`.
- Pressing a statement runs its `press` script, then jumps to any statement that replaced it.
- Presenting evidence checks `accept` first, then `nearMiss` (a hint with no penalty), then plays the wrong-answer script and calls `penalty()`. A testimony or step with `free` costs nothing.
- In 4화 a game over resets the gauge and `revealed` to their values at the start of that cross-examination. In 1화 running out of chances calls `outOfChances()`: "기록 보고 이어하기" opens the record and refills the chances; "이 심문 처음부터" resets `revealed`. Neither touches the prediction.
- 1화 also has two in-screen puzzles that cost nothing when wrong: `match` (engine/match.ts, pair a card from each of two records) and `photoTask` (engine/photos.ts, point at a part of a photo, then pick the last frame with it and the first without it).
- With `hintMode: 'manual'` (1화) hints only open on request: `HintPanel` (`engine/hints.ts`) shows `Testimony.hintText` or a step's `opts.hints`, one stage per press. Without it, `Testimony.hints` scripts play on loop-back and on H (4화).

**Input** goes through a handler stack in `engine/input.ts`. Only the top handler receives actions, so an open overlay blocks what is underneath; scripts wait with `waitFor([...])`. The settings and backlog panels are modals that sit above the stack. Keys are matched by `KeyboardEvent.code`, so they still work while the Korean IME is on. Choice screens push with `{ strict: true }`: they ignore key repeat and any key already held when they opened, so mashing Enter through dialogue never picks an answer. Enter and Space both emit `'advance'`; `fromSpace()` tells them apart (the court record uses Space for the large map/photo view, Enter to present).

**Rendering** uses a fixed 1280×720 stage scaled with the CSS variable `--scale`, so every coordinate (hotspots, detection boxes) is in stage pixels. The courtroom background follows the speaker's `Position` (`BG_FOR` in `stage.ts`), and `field(bg)` swaps in a location background.

**Saves** use one localStorage slot per case, `pan-dwijibgi:save:<caseId>`.
- Checkpoints are written at each scene start, at each investigation menu and at each cross-examination statement.
- `end` clears the save and marks the case as solved.
- When a rewrite makes old saves meaningless, change `CaseData.id`. 1화 also stores `CaseData.revision` (`EP1-R5`) in the save and rejects a mismatch; `legacyIds` lists the old ids so an unsolved player gets a one-time "내용이 개정되었어요" card.
- `CaseData.checkpoints` (1화 CP1–CP8) say what evidence, flags and prediction a scene starts with. They drive "장면 선택" on a solved case and `?scene=` jumps; a jump to a scene without one uses the nearest earlier checkpoint plus all evidence.

**Art is matched by file path only** (`engine/assets.ts`, eager `import.meta.glob`):

| Kind | Path | Notes |
|---|---|---|
| Characters | `chars/<CharId>/<emo>.png` | Missing expressions fall back to `normal.png` |
| Backgrounds | `bg/<id>.png` | |
| Evidence | `items/<evidenceId or art>.png` | |
| Profile photos | `portraits/<profileId>.png` | Otherwise cropped from the sprite via `sprite` and `face` |
| Event CG | `cg/<id>.png` | |
| Photo-set plates | `photos/<image>.png` | One background under every frame of a photo set; `engine/photos.ts` draws what changes on top |

Diagrams that must line up with the logic (the autopsy's injury chart) are drawn in code in `engine/figures.ts`, not painted. Missing art falls back to a placeholder. Every image is preloaded on the title screen; `src/assets` is about 125 MB of PNG today.

## Writing content

- `docs/series-bible.md` is the source of truth for world, characters, episode plots and tone (§9). If a story fact changes, edit the bible first. `docs/art-guide.md` has the art specs and prompts.
- 1화's ground-truth timeline is the comment at the top of `content/ep1/records.ts`, and its proof structure (which evidence establishes what, and what it does not, plus the spec-ID mapping E01–E12 / C01–C06 / Q04–Q13) is `docs/ep1-rewrite.md`. Testimony, evidence times, memos, the floor plan in `engine/maps.ts` and the 112 photo set in `engine/photos.ts` must agree with both. Every 1화 evidence card states `source`, `proves` and `limits`; dialogue must not claim more than `proves` allows.
- 1화 R4 teaches each system with a `guide()` card the first time it matters, splits the trial into three `chapter()` 공방, and has the prosecutor hand over the records during the opening statement on the wall screen (`panel()`). Don't hand records over in the lobby again, and don't have 나래 or 단비 name the evidence to present; jokes go in presses and stop at the victim, 조말순 and 태오's fear.
- The creator expects players to follow the dialogue, not the court record: whenever a record or board matters, someone says in plain words what it is and what it shows. Write natural spoken Korean, not translationese ("가능성을 닫다" was his example). Evidence cards stay short.
- Text markup: `{r}…{/}` is red emphasis and `{p}` is a beat of silence. For a Korean particle after a name that changes at runtime, use `josa()` from `engine/dom.ts`.
- When evidence is right but presented too early, acknowledge it in `nearMiss`, record it with `memo()`, then point at what is still missing; don't penalize. Give hints in order from vague to concrete.

## Art with Codex

Art is generated with the Codex CLI; the command pattern is in `docs/art-guide.md`. **Always redirect stdin (`codex exec … < /dev/null`), or it hangs waiting for input.** Make each new expression from that character's `normal.png` as the reference image. Afterwards, check that the PNGs really have alpha transparency.

## Commits

Write commit messages in Korean, with a one-line title and a bullet-list body; `git log` has examples. Work is committed straight to `main` (there is no remote yet), after the user has playtested the change.
