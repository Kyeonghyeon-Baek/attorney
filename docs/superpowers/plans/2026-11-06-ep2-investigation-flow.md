# EP2 Investigation Flow Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Implement the user-approved guided investigation and unknown destination thumbnails.
**Architecture:** Episode-owned conditional progress scripts unlock destinations using saved flags. The shared engine evaluates progress before menus and preserves previously visited destinations. EP2 opts into masked previews.
**Tech Stack:** Vanilla TypeScript, Vite, Node test runner.
**Spec:** User-approved design in this chat: day one visit → alley → entrance → roof → laundry → shrine/realty → senior; day two roof → scrap → two evidence trails → prosecutor.

## Global Constraints
- Preserve evidence IDs, save compatibility, optional exploration and explicit finish actions.
- EP2 and its assets remain development-only. No gameplay commits before creator playtesting.
- Korean player-facing copy; English code comments.

## Review Focus
- Existing saves retain access to visited places.
- Optional interactions never gate required destinations.
- Both middle investigation orders reach all goals.
- Reload does not repeat transition dialogue.
- Day-two locations visited on day one retain known artwork.

### Task 1: Guided progression
- [x] Add failing progression and save-resume tests in tests/ep2-investigation.test.mjs.
- [x] Add Location.progress and episode-owned unlock scripts; evaluate before menus.
- [x] Adjust destination references and day-two consent dialogue for new chronology.
- [x] Run targeted tests.

### Task 2: Destination previews
- [x] Add failing move-list tests for unknown, known and legacy visited locations.
- [x] Add opt-in unknown thumbnail and prior-location identity to Location/ListItem; style black question mark.
- [x] Verify keyboard and touch layout, no image exposed on unknown destinations.

### Task 3: Verification
- [x] Update play-flow documentation and README.
- [x] Run all tests, typecheck and production build; inspect UI.

## Execution ledger
- Baseline: 22 tests passed.
- Ruling: Git metadata is read-only (branch creation failed); work in supplied checkout without commits.
- Ruling: Use existing story facts; no series-bible changes needed. Approval in chat authorizes implementation without another confirmation round.

- Task 1: complete. New prerequisite tests failed before implementation; full day-one/day-two traversal now succeeds in both branch orders.
- Task 2: complete. Unknown preview test failed before implementation. Real Chrome playthrough verified desktop Enter and mobile landscape taps; unknown art is black with `?`, visited art returns.
- Task 3: complete. Node 24.22.2: 27 tests pass; TypeScript and production build pass. `git diff --check` clean. Independent read-only reviewer found no actionable correctness issues.
- Ruling: A new line implied 은결 had already agreed to attend before she appeared; changed it to a proposal to ask her.
- External dialogue review: automatic approval review denied sending the new source/dialogue to Gemini because explicit export authorization was absent. No external review performed; local wording/continuity review completed instead.
- Creator playtesting remains required before committing gameplay changes; no commits or releases made.


## Gemini dialogue review follow-up
- User explicitly requested review through their open Antigravity window. Completed read-only review with Gemini 4 Argon Medium in `Ace Attorney Ep2 Investigation Flow Review` (conversation `cc430108-1e4b-4a3e-bcc0-13e8d15d4902`). This supersedes the earlier blocked external-review status.
- Cross-checked all five findings against optional investigation interactions and `trial1.ts` recess1; accepted the corrections without changing unlock conditions.
- Removed assumed optional knowledge (blocked rooftop view, remote-support operator, jacket story); based the realty question on the required phone-screen evidence.
- Removed premature references to the residents' video, pocket contents and confirmed CCTV availability in next-destination notes.
- Corrected the day-two purpose from locating already-known papers to obtaining Soyoon's consent; the first trial already establishes the rice-jar location.
- Kept Narae's local knowledge as a new introduction to the community meeting. No story facts, evidence IDs, saves, or gates changed.
