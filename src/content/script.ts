import type {
  AmbienceName, AskOption, BgmName, BoardRow, CharId, Cmd, DaonMode, DetectBox, Script, SfxName, ShoutKind, StepOpts,
} from '../engine/types';
import type { MatchTask } from '../engine/match';
import type { PhotoTask } from '../engine/photos';

// Small helpers so case scripts read like a screenplay.

export const say = (who: CharId, text: string, emo?: string): Cmd => ({ t: 'say', who, text, emo });
/** Same as `say`, under another name tag (a voice nobody has identified yet: "???"). */
export const sayAs = (who: CharId, name: string, text: string, emo?: string): Cmd => ({ t: 'say', who, name, text, emo });
export const think = (text: string): Cmd => ({ t: 'think', text });
export const show = (who: CharId, emo?: string): Cmd => ({ t: 'show', who, emo });
export const shout = (kind: ShoutKind, who: CharId = 'dan'): Cmd => ({ t: 'shout', who, kind });
export const shake: Cmd = { t: 'fx', kind: 'shake' };
export const bigshake: Cmd = { t: 'fx', kind: 'bigshake' };
export const flash: Cmd = { t: 'fx', kind: 'flash' };
export const redflash: Cmd = { t: 'fx', kind: 'redflash' };
/** The verdict gauge throbs, to draw the eye to it. */
export const pulse: Cmd = { t: 'fx', kind: 'pulse' };
/** Narration or an announcement, without a name tag. */
export const note = (text: string): Cmd => ({ t: 'note', text });
/** Camera pushes in on the current speaker until the next cut. */
export const zoom: Cmd = { t: 'fx', kind: 'zoom' };
export const verdict = (word: string, acquit = false): Cmd => ({ t: 'verdict', word, acquit });
export const sfx = (name: SfxName): Cmd => ({ t: 'sfx', name });
export const bgm = (name: BgmName | null): Cmd => ({ t: 'bgm', name });
export const ambience = (name: AmbienceName | null): Cmd => ({ t: 'ambience', name });
export const wait = (ms: number): Cmd => ({ t: 'wait', ms });
export const place = (...lines: string[]): Cmd => ({ t: 'place', lines });
export const gauge = (delta: number): Cmd => ({ t: 'gauge', delta });
/** The AI re-runs its prediction: the bar moves to an exact value. */
export const gaugeSet = (value: number): Cmd => ({ t: 'gaugeSet', value });
/** The prediction as the story sets it, with the reason shown under the bar and its current basis. */
export const predict = (value: number, reason: string, status?: string): Cmd => ({ t: 'predict', value, reason, status });
/** Opens the court record on that evidence, at its newest unread addendum. */
export const showRecord = (id: string): Cmd => ({ t: 'showRecord', id });
/** Pairs a card from each of two records (1화: the 112 call and the alley recording). */
export const match = (task: MatchTask, opts?: StepOpts): Cmd => ({ t: 'match', task, opts });
/** Points at a part of a photo, then picks the frames around the change, inside the photo viewer. */
export const photoTask = (set: string, task: PhotoTask, opts?: StepOpts): Cmd => ({ t: 'photoTask', set, task, opts });
export const evidence = (id: string | null): Cmd => ({ t: 'evidence', id });
export const cross = (id: string): Cmd => ({ t: 'cross', id });
export const reveal = (...statements: string[]): Cmd => ({ t: 'reveal', statements });
export const daon = (mode: DaonMode): Cmd => ({ t: 'daon', mode });
export const goto = (scene: string): Cmd => ({ t: 'goto', scene });
export const end: Cmd = { t: 'end' };

/** Opens the 질문 재구성 menu with the camera on the one being asked. */
export const ask = (note: string, options: AskOption[], who: CharId = 'daon', title?: string): Cmd => ({ t: 'ask', who, note, options, title });
/** A plain choice (not an AI question) with its own heading, e.g. what to ask the defendant. */
export const choose = (title: string, note: string, options: AskOption[], who: CharId = 'dan', opts?: StepOpts): Cmd =>
  ({ t: 'ask', who, note, options, title, opts });
/** Point at the answer on a map; `answer` is one of the map's region ids. */
export const pinpoint = (map: string, prompt: string, answer: string, then: Script, wrong?: Script, opts?: StepOpts): Cmd =>
  ({ t: 'pinpoint', map, prompt, answer, then, wrong, opts });
export const option = (label: string, then: Script, correct = false): AskOption => ({ label, then, correct });

export const present = (
  prompt: string, answer: string | string[], then: Script, wrong?: Script, nearMiss?: Record<string, Script>, opts?: StepOpts,
): Cmd => ({ t: 'present', prompt, answer, then, wrong, nearMiss, opts });

export const addEvidence = (id: string): Cmd => ({ t: 'addEvidence', id });
export const flag = (name: string): Cmd => ({ t: 'flag', name });
/** Branches on a flag or a piece of evidence the player holds. */
export const when = (has: string, then: Script, otherwise?: Script): Cmd => ({ t: 'if', has, then, else: otherwise });
/** Free investigation that ends once every id in `until` is held, then plays `then`. */
export const investigate = (start: string, until: string[], then: Script): Cmd => ({ t: 'investigate', start, until, then });
export const addProfile = (id: string): Cmd => ({ t: 'addProfile', id });
/**
 * Leaves the courtroom for a location, or returns with null. The player's side stays
 * off screen as first-person voices unless `everyone` puts 강단비 and 신나래 on screen too.
 */
export const field = (bg: string | null, everyone = false): Cmd => ({ t: 'field', bg, everyone });
/** The court record's entry for `id` now reads `summary` (e.g. once a witness is unmasked). */
export const revise = (id: string, summary: string): Cmd => ({ t: 'revise', id, summary });
/** A later finding added under a piece of evidence; the original text stays as it was. */
export const annotate = (id: string, text: string): Cmd => ({ t: 'annotate', id, text });
/**
 * Branches on which piece of evidence (or person) the player just presented, so an argument can
 * start from the player's own choice when several answers are accepted.
 */
export const ifPresented = (id: string, then: Script, otherwise?: Script): Cmd =>
  ({ t: 'if', has: `presented:${id}`, then, else: otherwise });
/** Several records handed over at once, announced in one line. */
export const addEvidenceSet = (label: string, ...ids: string[]): Cmd => ({ t: 'addEvidenceSet', label, ids });

// ------------------------------------------------------------------ cinematics

/** Full-screen event illustration from src/assets/cg, or null to put it away. */
export const cg = (id: string | null): Cmd => ({ t: 'cg', id });
/** Security-camera view over whatever is on screen: label, a running clock, the AI's status line. */
export const cctv = (cam: string, time: string, status?: string): Cmd => ({ t: 'cctv', cam, time, status });
export const cctvOff: Cmd = { t: 'cctv', cam: null };
/** Replaces the camera AI's detection boxes (none clears them). */
export const detect = (...boxes: DetectBox[]): Cmd => ({ t: 'detect', boxes });
export const box = (label: string, x: number, y: number, w: number, h: number, alert = false): DetectBox =>
  ({ label, x, y, w, h, alert });
/** Puts a recording on: a player fills the screen until `tape(null)`. `art` is the device's item picture. */
export const tape = (title: string | null, art?: string): Cmd => ({ t: 'tape', title, art });
/** One line from the recording, with the time it was recorded. */
export const rec = (who: CharId, at: string, text: string, name?: string): Cmd => ({ t: 'rec', who, at, text, name });
/** A sound on the recording, described in brackets. */
export const recNote = (at: string, text: string): Cmd => ({ t: 'rec', at, text });
/** A witness's name plate slides in the first time they take the stand. */
export const introduce = (who: CharId, title: string): Cmd => ({ t: 'intro', who, title });
/** Cut to black (e.g. before a time card) and back. */
export const fadeOut: Cmd = { t: 'fade', black: true };
export const fadeIn: Cmd = { t: 'fade', black: false };
/** A briefing board: a timeline or a list. Calling it again with more rows adds them. */
export const board = (title: string, rows: BoardRow[]): Cmd => ({ t: 'board', title, rows });
export const boardOff: Cmd = { t: 'board', title: '', rows: null };
export const row = (time: string, text: string, tag?: BoardRow['tag'], badge?: string): BoardRow => ({ time, text, tag, badge });
/** The floor plan over the scene, with regions highlighted. */
export const plan = (map: string, marks: string[] = []): Cmd => ({ t: 'plan', map, marks });
export const planOff: Cmd = { t: 'plan', map: null };
/** A line in 강단비's notebook (court record → 메모). */
export const memo = (text: string): Cmd => ({ t: 'memo', text });
/** Hides the HUD for cinematic stretches (a prologue); `hud(true)` brings it back. */
export const hud = (on: boolean): Cmd => ({ t: 'hud', on });
/** Night lighting over backgrounds and people; `tint(null)` restores daylight. */
export const tint = (mode: 'night' | null): Cmd => ({ t: 'tint', mode });
/** The episode's title card. */
export const episode = (no: string, title: string): Cmd => ({ t: 'episode', no, title });
