# EP2 evidence redesign implementation plan

> Execution: user explicitly approved the proposed direction and requested development by GPT (orchestration, image generation, integration), Claude (UI/UX and engine), and Gemini (Korean writing and independent review). No commits before creator playtesting.

## Approved design

All 20 EP2 evidence records use a compact, readable summary (at most three rendered lines in supported desktop/mobile landscape layouts), representative visual and explicit detail action. Do not truncate clues or shrink text to achieve this. Detailed source material belongs in a fullscreen viewer appropriate to its type: photos, diagrams, messages, documents, tables and timed frames. Existing EP1/EP4 behavior and production gating remain intact.

Essential facts must be delivered in mandatory story flow before their first required inference, with visuals where useful. Optional record reading is for recall, not first exposure to indispensable clues. Facts are supplied; deductions remain the player's job. Preserve evidence limitations, ambiguous testimony, progressive unlocks, save compatibility and existing evidence/tab IDs. Updates replace the compact summary when needed; original material and later findings remain distinguishable in details.

Alternatives considered: text shortening alone would lose source detail; one generic long-text modal would preserve the reading burden. Chosen: compact summaries plus source-specific visual/detail pages and dialogue coverage.

## Ownership

- GPT: this plan, integration, image assets, verification and review coordination.
- Claude: engine/types.ts, engine/record.ts, supporting viewer module, style.css, EP2 evidence detail metadata and engine tests. Own records.ts after incorporating Gemini's proposed copy. May integrate scene changes from Gemini recommendations. Preserve all existing dirty changes.
- Gemini: read/review full EP2 evidence and scripts; write recommendations, 20 compact summary drafts, essential-clue coverage matrix and natural Korean dialogue patches to docs/ep2/evidence-language-review.md. Do not edit production files while Claude works.

## Deliverables and checks

- [x] Claude reviews feasibility and implements compact EP2 cards and fullscreen detail interaction. Check keyboard/touch navigation, Esc/back behavior, focus return, evidence/tab presentation, conditional sections and addendum visibility.
- [x] Gemini audits all 20 records and first-use prerequisites, proposes natural Korean summaries and dialogue; distinguish observations from deductions and later disclosures.
- [x] GPT creates and inspects photographic artwork for roof scene evidence; exact clue geometry/counts must remain correct, with deterministic labels/diagrams if needed. Preserve dev-only asset gates.
- [x] Claude integrates approved copy and mandatory-flow clue delivery; reuse current scene commands where possible, preserve IDs/checkpoints.
- [x] Cross-review: Claude checks integration and artwork behavior; Gemini reviews final text and spoiler timing; GPT verifies correctness and addresses findings.
- [x] Run npm test, npm run typecheck, npm run build and deployment-base build under Node 24 if available; verify production exclusion and desktop/mobile landscape UI. Report any unavailable checks honestly.

## Review focus

1. Old save with addenda and revised evidence: details and summary consistent, unseen clues locked.
2. Read/view versus present mode: inspecting does not accidentally present; correct subrecord ID is retained.
3. Small landscape layout: summary actually fits without truncation; full detail readable and close controls reachable.
4. Investigation ordering: indispensable facts received before first required use, no new deadlocks.
5. EP1 and EP4: opt-in changes only; no EP2 text/art in production bundle.

## Baseline

Preexisting uncommitted changes: src/content/ep2/investigation1.ts and tests/ep2-investigation.test.mjs. Snapshot: /tmp/ep2-evidence-collab/baseline.patch. Work in current shared checkout to preserve those changes and coordinate with the user's open apps; no reset, commit, push or deployment.

## Completed verification

Node 24.22.1: 43 tests passed, typecheck, normal build and `/attorney/` base build passed. GPT checked desktop card line counts, detail navigation, nested map/zoom close and actual presentation. Claude measured 20 initial and 13 revised summaries at 844×390 with forced touch layout: all at most two lines. Physical touch and full creator playthrough remain unverified. New EP2 art, diagrams and copy are absent from production output; existing shared maps were not changed. See docs/ep2/evidence-redesign-review.md. No commit, push or deployment.
