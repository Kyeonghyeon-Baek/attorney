import { sfx } from './audio';
import { el } from './dom';
import { push, pushModal } from './input';
import { settings, updateSettings, type TextSpeed } from './settings';
import { addFullscreenButton } from './viewport';

/** One row of the episode list. Without `caseId` the episode is shown as not yet available. */
export interface EpisodeEntry {
  no: string;
  title: string;
  tagline: string;
  caseNo?: string;
  thumb?: string;
  caseId?: string;
  /** Short line under the title: progress, or "해결". */
  status?: string;
  solved?: boolean;
}

/**
 * "사건 기록부": every episode as a case file. Resolves the chosen case id,
 * or null when the player backs out to the title.
 */
export function chooseEpisode(stage: HTMLElement, entries: EpisodeEntry[]): Promise<string | null> {
  const root = el('div', 'episodes', stage);
  const head = el('header', 'episodes-head', root);
  el('h2', 'episodes-title', head, '사건 기록부');
  el('p', 'episodes-sub', head, '서울 즉결법원 · 국선전담변호인 강단비');
  const grid = el('div', 'episodes-grid', root);
  const cards: { node: HTMLButtonElement; entry: EpisodeEntry }[] = [];
  for (const entry of entries) {
    const node = el('button', entry.caseId ? 'ep-card' : 'ep-card locked', grid);
    node.disabled = !entry.caseId;
    const thumb = el('div', 'ep-thumb', node);
    if (entry.thumb) thumb.style.backgroundImage = `url("${entry.thumb}")`;
    if (!entry.caseId) el('span', 'ep-lock', thumb, '준비 중');
    if (entry.solved) el('span', 'ep-stamp', thumb, '해결');
    const meta = el('div', 'ep-meta', node);
    el('span', 'ep-no', meta, entry.no);
    if (entry.caseNo) el('span', 'ep-caseno', meta, entry.caseNo);
    el('div', 'ep-title', node, entry.title);
    el('p', 'ep-tagline', node, entry.tagline);
    el('div', 'ep-status', node, entry.status ?? (entry.caseId ? '새 사건' : '기록이 아직 봉인되어 있어요'));
    cards.push({ node, entry });
  }
  const foot = el('footer', 'episodes-foot', root);
  const back = el('button', 'btn', foot, '← 타이틀  Esc');
  const hint = el('p', 'episodes-hint', foot, '← → 로 사건을 고르고 Enter, 또는 클릭');

  const open = cards.filter((c) => c.entry.caseId);
  // Nothing is chosen at first, so Enter carried over from an ending cannot start an episode.
  let sel = -1;
  const focus = () => open[sel]?.node.focus();

  return new Promise((resolve) => {
    const done = (id: string | null) => {
      pop();
      root.remove();
      resolve(id);
    };
    const pick = (i: number) => {
      sfx('evidence');
      done(open[i].entry.caseId!);
    };
    const pop = push((a) => {
      if (a === 'back') {
        sfx('close');
        done(null);
      } else if (a === 'advance') {
        const i = open.findIndex((c) => c.node === document.activeElement);
        if (i >= 0) pick(i);
        else if (document.activeElement === back) done(null);
        else hint.classList.add('nudge');
      } else if (a === 'right' || a === 'down') {
        sel = (sel + 1) % open.length;
        sfx('select');
        focus();
      } else if (a === 'left' || a === 'up') {
        sel = sel < 0 ? open.length - 1 : (sel - 1 + open.length) % open.length;
        sfx('select');
        focus();
      }
    }, { strict: true });
    open.forEach((c, i) => c.node.addEventListener('click', () => pick(i)));
    back.addEventListener('click', () => done(null));
  });
}

const SPEEDS: { id: TextSpeed; label: string }[] = [
  { id: 'slow', label: '느리게' },
  { id: 'normal', label: '보통' },
  { id: 'fast', label: '빠르게' },
  { id: 'instant', label: '바로' },
];

/** Text speed and volume. Opens over anything, including the title screen. */
export class SettingsPanel {
  private root: HTMLElement | null = null;

  get isOpen(): boolean {
    return !!this.root;
  }

  /** `actions` adds buttons (e.g. back to the case list); one closes the panel, then runs. */
  open(stage: HTMLElement, actions: { label: string; run: () => void }[] = []): Promise<void> {
    if (this.root) return Promise.resolve();
    const root = el('div', 'settings', stage);
    this.root = root;
    const panel = el('div', 'settings-panel', root);
    el('h2', 'settings-title', panel, '설정');
    const rows: HTMLElement[] = [];

    const speedRow = el('div', 'set-row', panel);
    el('span', 'set-label', speedRow, '대사 속도');
    const speedBox = el('div', 'set-seg', speedRow);
    const speedBtns = SPEEDS.map((s) => {
      const b = el('button', 'seg', speedBox, s.label);
      b.addEventListener('click', () => setSpeed(s.id));
      return b;
    });
    rows.push(speedRow);

    const volumeRow = (label: string, key: 'music' | 'sfx') => {
      const row = el('div', 'set-row', panel);
      el('span', 'set-label', row, label);
      const minus = el('button', 'vol-step', row, '−');
      const meter = el('div', 'vol-meter', row);
      const ticks = Array.from({ length: 10 }, (_, i) => {
        const t = el('i', '', meter);
        t.addEventListener('click', () => setVol(key, i + 1));
        return t;
      });
      const plus = el('button', 'vol-step', row, '+');
      const value = el('span', 'vol-value', row);
      minus.addEventListener('click', () => setVol(key, settings()[key] - 1));
      plus.addEventListener('click', () => setVol(key, settings()[key] + 1));
      rows.push(row);
      return () => {
        const v = settings()[key];
        ticks.forEach((t, i) => t.classList.toggle('on', i < v));
        value.textContent = v === 0 ? '끔' : String(v);
      };
    };
    const paintMusic = volumeRow('음악', 'music');
    const paintSfx = volumeRow('효과음 · 목소리', 'sfx');

    el('p', 'settings-note', panel, '↑ ↓ 항목 고르기   ← → 바꾸기');
    addFullscreenButton(panel);
    let after: (() => void) | null = null;
    if (actions.length) {
      const box = el('div', 'settings-actions', panel);
      for (const act of actions) {
        const b = el('button', 'btn', box, act.label);
        b.addEventListener('click', () => {
          after = act.run;
          finishRef?.();
        });
      }
    }
    let finishRef: (() => void) | null = null;
    const close = el('button', 'btn btn-primary settings-close', panel, '닫기  Esc');

    let row = 0;
    const paint = () => {
      const s = settings();
      speedBtns.forEach((b, i) => b.classList.toggle('on', SPEEDS[i].id === s.text));
      paintMusic();
      paintSfx();
      rows.forEach((r, i) => r.classList.toggle('on', i === row));
    };
    const setSpeed = (id: TextSpeed) => {
      updateSettings({ text: id });
      sfx('select');
      paint();
    };
    const setVol = (key: 'music' | 'sfx', v: number) => {
      updateSettings({ [key]: v });
      sfx(key === 'sfx' ? 'evidence' : 'select');
      paint();
    };
    const nudge = (d: number) => {
      const s = settings();
      if (row === 0) {
        const i = SPEEDS.findIndex((x) => x.id === s.text);
        setSpeed(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i + d))].id);
      } else {
        const key = row === 1 ? 'music' : 'sfx';
        setVol(key, s[key] + d);
      }
    };
    paint();
    sfx('paper');

    return new Promise((resolve) => {
      const finish = () => {
        pop();
        root.remove();
        this.root = null;
        sfx('close');
        resolve();
        after?.();
      };
      finishRef = finish;
      const pop = pushModal((a) => {
        if (a === 'back' || a === 'advance') finish();
        else if (a === 'up') {
          row = (row + rows.length - 1) % rows.length;
          paint();
        } else if (a === 'down') {
          row = (row + 1) % rows.length;
          paint();
        } else if (a === 'left') nudge(-1);
        else if (a === 'right') nudge(1);
      });
      close.addEventListener('click', finish);
      root.addEventListener('click', (e) => {
        if (e.target === root) finish();
      });
    });
  }
}
