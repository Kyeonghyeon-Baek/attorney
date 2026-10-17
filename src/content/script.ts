import type { AmbienceName, AskOption, BgmName, CharId, Cmd, DaonMode, Script, SfxName, ShoutKind } from '../engine/types';

// Small helpers so case scripts read like a screenplay.

export const say = (who: CharId, text: string, emo?: string): Cmd => ({ t: 'say', who, text, emo });
export const think = (text: string): Cmd => ({ t: 'think', text });
export const show = (who: CharId, emo?: string): Cmd => ({ t: 'show', who, emo });
export const shout = (kind: ShoutKind, who: CharId = 'dan'): Cmd => ({ t: 'shout', who, kind });
export const shake: Cmd = { t: 'fx', kind: 'shake' };
export const bigshake: Cmd = { t: 'fx', kind: 'bigshake' };
export const flash: Cmd = { t: 'fx', kind: 'flash' };
export const sfx = (name: SfxName): Cmd => ({ t: 'sfx', name });
export const bgm = (name: BgmName | null): Cmd => ({ t: 'bgm', name });
export const ambience = (name: AmbienceName | null): Cmd => ({ t: 'ambience', name });
export const wait = (ms: number): Cmd => ({ t: 'wait', ms });
export const place = (...lines: string[]): Cmd => ({ t: 'place', lines });
export const gauge = (delta: number): Cmd => ({ t: 'gauge', delta });
/** The AI re-runs its prediction: the bar moves to an exact value. */
export const gaugeSet = (value: number): Cmd => ({ t: 'gaugeSet', value });
export const evidence = (id: string | null): Cmd => ({ t: 'evidence', id });
export const cross = (id: string): Cmd => ({ t: 'cross', id });
export const reveal = (...statements: string[]): Cmd => ({ t: 'reveal', statements });
export const daon = (mode: DaonMode): Cmd => ({ t: 'daon', mode });
export const goto = (scene: string): Cmd => ({ t: 'goto', scene });
export const end: Cmd = { t: 'end' };

/** Opens the 질문 재구성 menu with the camera on the one being asked. */
export const ask = (note: string, options: AskOption[], who: CharId = 'daon'): Cmd => ({ t: 'ask', who, note, options });
export const option = (label: string, then: Script, correct = false): AskOption => ({ label, then, correct });

export const present = (prompt: string, answer: string, then: Script, wrong?: Script): Cmd =>
  ({ t: 'present', prompt, answer, then, wrong });

export const addEvidence = (id: string): Cmd => ({ t: 'addEvidence', id });
export const flag = (name: string): Cmd => ({ t: 'flag', name });
/** Branches on a flag or a piece of evidence the player holds. */
export const when = (has: string, then: Script, otherwise?: Script): Cmd => ({ t: 'if', has, then, else: otherwise });
/** Free investigation that ends once every id in `until` is held, then plays `then`. */
export const investigate = (start: string, until: string[], then: Script): Cmd => ({ t: 'investigate', start, until, then });
export const addProfile = (id: string): Cmd => ({ t: 'addProfile', id });
/** Leaves the courtroom for a location shown first-person (no menu), or returns with null. */
export const field = (bg: string | null): Cmd => ({ t: 'field', bg });
