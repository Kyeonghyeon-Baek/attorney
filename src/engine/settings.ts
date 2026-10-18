// Player preferences, kept per browser. Like saves, a storage failure just means defaults.

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';

export interface Settings {
  text: TextSpeed;
  /** 0..10 */
  music: number;
  /** 0..10, also covers voices and room tone. */
  sfx: number;
}

const KEY = 'pan-dwijibgi:settings';
const DEFAULTS: Settings = { text: 'normal', music: 8, sfx: 8 };

/** Milliseconds per character for each text speed. */
export const CHAR_MS: Record<TextSpeed, number> = { slow: 48, normal: 30, fast: 15, instant: 0 };

let current: Settings = load();
const listeners: ((s: Settings) => void)[] = [];

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const s = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
    if (!(s.text in CHAR_MS)) s.text = DEFAULTS.text;
    s.music = clamp(s.music);
    s.sfx = clamp(s.sfx);
    return s;
  } catch {
    return { ...DEFAULTS };
  }
}

function clamp(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n))) : 8;
}

export function settings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  current.music = clamp(current.music);
  current.sfx = clamp(current.sfx);
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Keep the change for this session only.
  }
  listeners.forEach((fn) => fn(current));
}

export function onSettings(fn: (s: Settings) => void): void {
  listeners.push(fn);
}
