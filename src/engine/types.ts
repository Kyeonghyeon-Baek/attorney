/** `operator` is the hidden human answering through Daon's monitor; `haeun` is her in person. */
export type CharId = 'dan' | 'narae' | 'eom' | 'judge' | 'daon' | 'operator' | 'soonja' | 'haeun' | 'seo' | 'gu';
export type Position = 'defense' | 'prosecution' | 'witness' | 'judge' | 'counsel' | 'defendant' | 'field';
export type ShoutKind = 'objection' | 'holdit' | 'takethat';
export type Voice = 'high' | 'mid' | 'low' | 'deep' | 'ai' | 'soft' | 'warm' | 'gruff';
export type SfxName =
  | 'gavel' | 'gavel3' | 'shout' | 'damage' | 'heal' | 'reveal' | 'glitch'
  | 'boot' | 'whoosh' | 'select' | 'open' | 'close' | 'evidence'
  | 'paper' | 'slam' | 'realize' | 'shock' | 'murmur' | 'step' | 'door' | 'typing' | 'heartbeat'
  | 'breakdown' | 'cheer';
export type BgmName =
  | 'trial' | 'testimony' | 'cross' | 'pursuit' | 'suspense' | 'daon'
  | 'investigate' | 'emptyroom' | 'serverroom' | 'sorrow'
  | 'cornered' | 'victory' | 'ending';
export type AmbienceName = 'court' | 'lobby' | 'clock' | 'hum' | 'lounge';
export type DaonMode = 'normal' | 'glitch' | 'human';
export type IconName = 'door' | 'autopsy' | 'card' | 'brochure' | 'log' | 'contract' | 'mic';

export interface Character {
  id: CharId;
  name: string;
  pos: Position;
  voice: Voice;
  color: string;
}

export interface Evidence {
  id: string;
  name: string;
  label: string;
  icon: IconName;
  summary: string;
  detail: string[];
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
  | { t: 'think'; text: string }
  | { t: 'show'; who: CharId; emo?: string }
  | { t: 'shout'; who: CharId; kind: ShoutKind }
  | { t: 'fx'; kind: 'shake' | 'bigshake' | 'flash' | 'redflash' | 'zoom' }
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
  | { t: 'present'; prompt: string; answer: string; then: Script; wrong?: Script }
  | { t: 'ask'; who: CharId; note: string; options: AskOption[] }
  | { t: 'reveal'; statements: string[] }
  | { t: 'daon'; mode: DaonMode }
  | { t: 'addEvidence'; id: string }
  | { t: 'addProfile'; id: string }
  | { t: 'field'; bg: string | null }
  | { t: 'flag'; name: string }
  | { t: 'if'; has: string; then: Script; else?: Script }
  | { t: 'investigate'; start: string; until: string[]; then: Script }
  | { t: 'goto'; scene: string }
  | { t: 'end' };

export type Script = Cmd[];

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
