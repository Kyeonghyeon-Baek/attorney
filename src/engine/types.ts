import type { FigureMark } from './figures';
import type { MatchTask } from './match';
import type { PhotoTask } from './photos';
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
  | 'title' | 'night' | 'oh' | 'jeong' | 'eom' | 'objection'
  | 'crossTense' | 'testimonyTense' | 'climax' | 'pursuitTruth' | 'waitroom';
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
  /**
   * Where the face sits in the sprite (fractions of its width and height) and how far to zoom
   * for a face photo (sprite widths per photo width). Used by every face crop of this character.
   */
  face?: [number, number, number];
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
  /** Where the record comes from, what it shows, and what it cannot show on its own. */
  source?: string;
  proves?: string[];
  limits?: string[];
  /** A set of still photos the court record can compare side by side (see src/engine/photos.ts). */
  photos?: string;
  /** Shelf in the court record ("카메라·현장", "녹음·통화"…). Groups keep the order they first appear in. */
  group?: string;
  /** A diagram drawn under the summary (see src/engine/figures.ts), e.g. the autopsy's injury chart. */
  figure?: string;
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
  /**
   * Face centre as fractions of the picture's width and height, and the zoom. Only for a
   * dedicated portrait: sprite crops take the character's own `face` (characters.ts).
   */
  face?: [number, number, number];
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
  /**
   * The AI prediction as the story sets it (1화): an exact value, why it moved, and what it rests on.
   * Wrong answers never change it.
   */
  | { t: 'predict'; value: number; reason: string; status?: string }
  /** Opens the court record on one piece of evidence, scrolled to its newest unread addendum. */
  | { t: 'showRecord'; id: string }
  /** The question the trial is on right now, one line under the prediction (null clears it). */
  | { t: 'issue'; text: string | null }
  /** Steps the HUD back during a climax so the evidence and faces hold the eye. */
  | { t: 'dimHud'; on: boolean }
  /** Two records side by side: the player pairs a card from each row (see engine/match.ts). */
  | { t: 'match'; task: MatchTask; opts?: StepOpts }
  /** A step inside a photo set's viewer: point at a part, then pick two frames (see engine/photos.ts). */
  | { t: 'photoTask'; set: string; task: PhotoTask; opts?: StepOpts }
  | { t: 'evidence'; id: string | null }
  | { t: 'cross'; id: string }
  /** `nearMiss`: evidence that is right but not enough yet. It plays with no penalty and the question stays open. */
  | {
    t: 'present'; prompt: string; answer: string | string[]; then: Script; wrong?: Script;
    nearMiss?: Record<string, Script>; opts?: StepOpts;
  }
  | { t: 'ask'; who: CharId; note: string; options: AskOption[]; title?: string; opts?: StepOpts }
  /** The player points at a spot on a map (e.g. the store's floor plan); `answer` is a region id. */
  | { t: 'pinpoint'; map: string; prompt: string; answer: string; then: Script; wrong?: Script; opts?: StepOpts }
  | { t: 'reveal'; statements: string[] }
  | { t: 'daon'; mode: DaonMode }
  | { t: 'addEvidence'; id: string }
  | { t: 'addEvidenceSet'; label: string; ids: string[] }
  /** Rewrites what the court record says about a piece of evidence or a person. */
  | { t: 'revise'; id: string; summary: string }
  /** Adds a dated line under a piece of evidence (a later finding), leaving the original text as it was. */
  | { t: 'annotate'; id: string; text: string }
  | { t: 'addProfile'; id: string }
  | { t: 'field'; bg: string | null; everyone?: boolean }
  | { t: 'flag'; name: string }
  | { t: 'if'; has: string; then: Script; else?: Script }
  | { t: 'investigate'; start: string; until: string[]; then: Script }
  | { t: 'cg'; id: string | null }
  | { t: 'cctv'; cam: string | null; time?: string; status?: string }
  | { t: 'detect'; boxes: DetectBox[] }
  /** `art` picks the device picture (an item id); the default is the 1화 recorder. */
  | { t: 'tape'; title: string | null; art?: string }
  | { t: 'intro'; who: CharId; title: string }
  | { t: 'episode'; no: string; title: string }
  /** Fades the whole picture to black (true) or back (false). The text box stays usable. */
  | { t: 'fade'; black: boolean }
  /** A briefing board over the scene (a timeline or a list); null rows hide it. */
  | { t: 'board'; title: string; rows: BoardRow[] | null }
  /** Shows a map (floor plan) over the scene with some regions highlighted and routes drawn; null hides it. */
  | { t: 'plan'; map: string | null; marks?: string[]; routes?: PlanRoute[] }
  /** The courtroom's wall screen: a row of cards (people, records, roles); null cards hide it. */
  | { t: 'panel'; title: string; cards: PanelCard[] | null }
  /** A drawn diagram over the scene (see engine/figures.ts) with labelled spots; null hides it. */
  | { t: 'figure'; id: string | null; marks?: FigureMark[] }
  /** A how-to card the first time a system matters. `focus` lights up that part of the HUD. */
  | { t: 'guide'; title: string; lines: GuideLine[]; focus?: GuideFocus }
  /** A title card for one stretch of the trial and the question it settles. */
  | { t: 'chapter'; no: string; title: string }
  /**
   * One screen to look over (a bag on the evidence table): the player picks spots until `until`
   * (a flag or evidence id) is held. No menu and no way out until then.
   */
  | { t: 'examine'; bg: string; prompt: string; spots: Hotspot[]; until: string }
  /** Adds a line to 강단비's notebook tab in the court record. */
  | { t: 'memo'; text: string }
  /** Hides or restores the courtroom HUD (verdict gauge and buttons). */
  | { t: 'hud'; on: boolean }
  /** Lighting over the scene: 'night' darkens it, null restores. */
  | { t: 'tint'; mode: 'night' | null }
  | { t: 'goto'; scene: string }
  | { t: 'end' };

export type Script = Cmd[];

/** Options for a single question (present, choice, map pick). */
export interface StepOpts {
  /** A wrong answer here costs no review chance (tutorials, concept checks). */
  free?: boolean;
  /** Hints on request, vague to concrete (manual hint mode). */
  hints?: string[];
  /** Keeps hint progress apart from other questions; defaults to the prompt. */
  hintKey?: string;
}

/** What a guide card points at in the HUD. */
export type GuideFocus = 'gauge' | 'chances' | 'tools';

/** A guide line, or one that names keyboard keys with its wording for touch screens beside it. */
export type GuideLine = string | { keyboard: string; touch: string };

/**
 * One card on the courtroom's wall screen. `img` is 'profile:<id>', 'char:<CharId>', 'item:<evidenceId>',
 * 'icon:<name>' (see cinema.ts) or 'figure:<id>'. `tag` names what the card is ("기록", "AI 분류",
 * "검찰 주장") so the tone colour is never the only cue.
 */
export interface PanelCard {
  img?: string;
  name: string;
  role?: string;
  text?: string;
  tag?: string;
  tone?: 'fact' | 'claim' | 'ai' | 'person' | 'pending';
}

/**
 * A line over a map, in the map's coordinates: a movement a record shows ('fact', solid), the
 * stretch nothing recorded ('unseen', faint dashes), or someone's account ('claim', red dashes).
 */
export interface PlanRoute {
  points: [number, number][];
  kind: 'fact' | 'unseen' | 'claim';
  label?: string;
  /** Where the label's left edge sits (default: beside the last point). */
  at?: [number, number];
}

/** One line on a briefing board. */
export interface BoardRow {
  time: string;
  text: string;
  /** 'key' is highlighted, 'claim' marks someone's claim, 'muted' is greyed out, 'struck' is crossed out. */
  tag?: 'key' | 'claim' | 'muted' | 'struck';
  /** A word saying what kind of line this is ("기록", "진술", "주장"), so colour is not the only cue. */
  badge?: string;
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
  /** With review chances (1화): wrong evidence here costs no chance (tutorials). */
  free?: boolean;
  /** Hints on request, vague to concrete (manual hint mode); replaces `hints`. */
  hintText?: string[];
  /**
   * Hints from vague to concrete. One plays each time the player loops back past the last
   * statement, or right away on the hint button (H). The last one repeats.
   */
  hints?: Script[];
  /**
   * With manual hints (1화): what 강단비 or 나래 says each time the testimony comes round to its
   * first statement again, from general to more pointed. The last one repeats.
   */
  loop?: Script[];
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
