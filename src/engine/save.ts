import type { Entry } from './backlog';

// One autosave slot per case, kept in this browser's localStorage.
// Storage can be missing or full (private windows, blocked site data), so every
// access is wrapped and a failed save simply means the game starts fresh next time.

const VERSION = 1;

export interface CrossResume {
  /** Testimony id. */
  id: string;
  /** Statement the player was looking at. */
  index: number;
  /** What a game over resets to. */
  gaugeStart: number;
  revealedStart: string[];
}

export interface SaveData {
  v: number;
  caseId: string;
  savedAt: number;
  /** Shown on the title screen, e.g. "조사: 고객센터". */
  label: string;
  scene: string;
  /** Investigation location to resume at. */
  loc?: string;
  /** Resume inside a cross-examination instead of from the top of the scene. */
  cross?: CrossResume;
  flags: string[];
  evidence: string[];
  revealed: string[];
  gauge: number;
  wrongs: number;
  /** Play time so far, in ms. */
  elapsed: number;
  /** The last lines of the line history, so 대사 기록 still has context after resuming. */
  log?: Entry[];
}

const key = (caseId: string) => `pan-dwijibgi:save:${caseId}`;

export function loadSave(caseId: string): SaveData | null {
  try {
    const raw = localStorage.getItem(key(caseId));
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.v !== VERSION || data.caseId !== caseId || typeof data.scene !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: Omit<SaveData, 'v' | 'savedAt'>): void {
  try {
    localStorage.setItem(key(data.caseId), JSON.stringify({ ...data, v: VERSION, savedAt: Date.now() }));
  } catch {
    // Storage unavailable: keep playing without saves.
  }
}

export function clearSave(caseId: string): void {
  try {
    localStorage.removeItem(key(caseId));
  } catch {
    // Nothing to clear.
  }
}

const clearKey = (caseId: string) => `pan-dwijibgi:clear:${caseId}`;

/** Remembers that a case was played to its ending, for the episode list. */
export function markCleared(caseId: string): void {
  try {
    localStorage.setItem(clearKey(caseId), String(Date.now()));
  } catch {
    // Not remembered; the episode just won't show as solved.
  }
}

export function isCleared(caseId: string): boolean {
  try {
    return localStorage.getItem(clearKey(caseId)) !== null;
  } catch {
    return false;
  }
}
