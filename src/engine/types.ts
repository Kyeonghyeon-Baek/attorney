/**
 * `operator` is the hidden human answering through Daon's monitor; `haeun` is her in person.
 * `bang`, `watch` and `iguard` are voices only (a victim heard in the prologue and on tape,
 * a smartwatch assistant, the store's camera AI).
 */
export type CharId =
  | 'dan' | 'narae' | 'eom' | 'judge' | 'gu'
  | 'daon' | 'operator' | 'soonja' | 'haeun' | 'seo'
  | 'taeo' | 'oh' | 'malsun' | 'bang' | 'watch' | 'iguard';
export type Position = 'defense' | 'prosecution' | 'witness' | 'judge' | 'counsel' | 'defendant' | 'field';
export type ShoutKind = 'objection' | 'holdit' | 'takethat';
export type Voice = 'high' | 'mid' | 'low' | 'deep' | 'ai' | 'soft' | 'warm' | 'gruff' | 'young' | 'slick' | 'granny' | 'device';
export type SfxName =
  | 'gavel' | 'gavel3' | 'shout' | 'damage' | 'heal' | 'reveal' | 'glitch'
  | 'boot' | 'whoosh' | 'select' | 'open' | 'close' | 'evidence'
  | 'paper' | 'slam' | 'realize' | 'shock' | 'murmur' | 'step' | 'door' | 'typing' | 'heartbeat'
  | 'breakdown' | 'cheer'
  | 'chime' | 'watch' | 'shutter' | 'detect' | 'tape' | 'thud';
export type BgmName =
  | 'trial' | 'testimony' | 'cross' | 'pursuit' | 'suspense' | 'daon'
  | 'investigate' | 'emptyroom' | 'serverroom' | 'sorrow'
  | 'cornered' | 'victory' | 'ending'
  | 'title' | 'night' | 'oh' | 'jeong' | 'eom' | 'objection';
export type AmbienceName = 'court' | 'lobby' | 'clock' | 'hum' | 'lounge' | 'store' | 'alley' | 'tape';
export type DaonMode = 'normal' | 'glitch' | 'human';
export type IconName = 'door' | 'autopsy' | 'card' | 'brochure' | 'log' | 'contract' | 'mic';

export interface Character {
  id: CharId;
  name: string;
  pos: Position;
  voice: Voice;
  color: string;
  /** Heard but never drawn: speaking leaves whoever is on screen in place. */
  offscreen?: boolean;
}

export interface Evidence {
  id: string;
  name: string;
  label: string;
  icon: IconName;
  /** Item picture to use when it is not named after `id` (two cases can share one). */
  art?: string;
  /** A map the court record can open full screen (see src/engine/maps.ts). */
  map?: string;
  summary: string;
  detail: string[];
  /** A log better read as columns (shown above `detail`). Rows listed in `quiet` are dimmed. */
  table?: { head: string[]; rows: string[][]; quiet?: number[] };
}

export interface Profile {
  id: string;
  name: string;
  meta: string;
  color: string;
  summary: string;
  /** Joins the court record only when a script adds it. */
  later?: boolean;
  /** Character whose sprite supplies the photo, cropped around `face`. */
  sprite?: CharId;
  /** Face centre in the sprite as fractions of its width and height. */
  face?: [number, number];
  /** Drawn as Daon's glowing orb instead of a photo. */
  orb?: boolean;
}

export interface AskOption {
  label: string;
  then: Script;
  correct?: boolean;
}

export type Cmd =
  | { t: 'say'; who: CharId; text: string; emo?: string; name?: string }
  /** A line played back from a recording, stamped with the time it was recorded. No `who`: a sound, not a voice. */
  | { t: 'rec'; who?: CharId; text: string; at: string; name?: string }
  | { t: 'think'; text: string }
  | { t: 'show'; who: CharId; emo?: string }
  | { t: 'shout'; who: CharId; kind: ShoutKind }
  | { t: 'fx'; kind: 'shake' | 'bigshake' | 'flash' | 'redflash' | 'zoom' | 'pulse' }
  /** Narration or an announcement: no name tag, no voice. */
  | { t: 'note'; text: string }
  | { t: 'verdict'; word: string; acquit?: boolean }
  | { t: 'sfx'; name: SfxName }
  | { t: 'bgm'; name: BgmName | null }
  | { t: 'ambience'; name: AmbienceName | null }
  | { t: 'wait'; ms: number }
  | { t: 'place'; lines: string[] }
  | { t: 'gauge'; delta: number }
  | { t: 'gaugeSet'; value: number }
  | { t: 'evidence'; id: string | null }
  | { t: 'cross'; id: string }
  | { t: 'present'; prompt: string; answer: string | string[]; then: Script; wrong?: Script }
  | { t: 'ask'; who: CharId; note: string; options: AskOption[]; title?: string }
  /** The player points at a spot on a map (e.g. the store's floor plan); `answer` is a region id. */
  | { t: 'pinpoint'; map: string; prompt: string; answer: string; then: Script; wrong?: Script }
  | { t: 'reveal'; statements: string[] }
  | { t: 'daon'; mode: DaonMode }
  | { t: 'addEvidence'; id: string }
  | { t: 'addEvidenceSet'; label: string; ids: string[] }
  /** Rewrites what the court record says about a piece of evidence or a person. */
  | { t: 'revise'; id: string; summary: string }
  | { t: 'addProfile'; id: string }
  | { t: 'field'; bg: string | null; everyone?: boolean }
  | { t: 'flag'; name: string }
  | { t: 'if'; has: string; then: Script; else?: Script }
  | { t: 'investigate'; start: string; until: string[]; then: Script }
  | { t: 'cg'; id: string | null }
  | { t: 'cctv'; cam: string | null; time?: string; status?: string }
  | { t: 'detect'; boxes: DetectBox[] }
  | { t: 'tape'; title: string | null }
  | { t: 'intro'; who: CharId; title: string }
  | { t: 'episode'; no: string; title: string }
  /** Fades the whole picture to black (true) or back (false). The text box stays usable. */
  | { t: 'fade'; black: boolean }
  /** A briefing board over the scene (a timeline or a list); null rows hide it. */
  | { t: 'board'; title: string; rows: BoardRow[] | null }
  /** Shows a map (floor plan) over the scene with some regions highlighted; null hides it. */
  | { t: 'plan'; map: string | null; marks?: string[] }
  /** Adds a line to 강단비's notebook tab in the court record. */
  | { t: 'memo'; text: string }
  /** Hides or restores the courtroom HUD (verdict gauge and buttons). */
  | { t: 'hud'; on: boolean }
  /** Lighting over the scene: 'night' darkens it, null restores. */
  | { t: 'tint'; mode: 'night' | null }
  | { t: 'goto'; scene: string }
  | { t: 'end' };

export type Script = Cmd[];

/** One line on a briefing board. */
export interface BoardRow {
  time: string;
  text: string;
  /** 'key' is highlighted, 'claim' marks the prosecution's claim, 'muted' is greyed out. */
  tag?: 'key' | 'claim' | 'muted';
}

/** A box the store's camera AI draws around what it sees, in stage pixels (1280×720). */
export interface DetectBox {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Red and blinking: something the AI flags. */
  alert?: boolean;
}

export interface Statement {
  id: string;
  who: CharId;
  text: string;
  emo?: string;
  press?: Script;
  /** Shown only after a `reveal` command names it. */
  hidden?: boolean;
  /** When revealed, this statement takes the place of the one with this id. */
  replaces?: string;
  /** Evidence ids that break this statement. */
  accept?: string[];
  /** Evidence that is close but not the answer: plays a hint with no penalty. */
  nearMiss?: Record<string, Script>;
}

export interface Testimony {
  id: string;
  title: string;
  statements: Statement[];
  /** Plays after the testimony is heard once, before cross-examination starts. */
  beforeCross?: Script;
  /** Music while the testimony is heard the first time (default: 'testimony'). */
  hearing?: BgmName;
  /** Music during cross-examination (default: the case's `crossBgm`, else what was playing). */
  crossBgm?: BgmName;
  /** How far a wrong piece of evidence pushes the verdict here (default: the case's). */
  penalty?: number;
  /**
   * Hints from vague to concrete. One plays each time the player loops back past the last
   * statement, or right away on the hint button (H). The last one repeats.
   */
  hints?: Script[];
  /** Plays when accepted evidence is presented. */
  contradiction: Script;
  wrong?: Script;
}

// ------------------------------------------------------------------ investigation

export interface Hotspot {
  id: string;
  /** What the player sees on hover, e.g. "접수대". */
  label: string;
  /** Rectangle in stage pixels (the stage is 1280×720). */
  x: number;
  y: number;
  w: number;
  h: number;
  script: Script;
  /** Plays on later visits instead of `script`. */
  again?: Script;
}

export interface Topic {
  id: string;
  label: string;
  script: Script;
  /** Flag or evidence id that must be held before this topic appears. */
  requires?: string;
}

export interface Location {
  id: string;
  name: string;
  /** Background id under src/assets/bg. */
  bg: string;
  bgm?: BgmName;
  ambience?: AmbienceName;
  /** Played on arrival, after the footsteps (e.g. a door). */
  arrive?: SfxName;
  person?: CharId;
  connects: string[];
  /** Plays the first time the player arrives. */
  enter?: Script;
  hotspots: Hotspot[];
  talks?: Topic[];
  presents?: Record<string, Script>;
  presentDefault?: Script;
}
