import { sfx } from './audio';
import { el } from './dom';
import { pushModal } from './input';
import type { LineStyle } from './textbox';

export interface Entry {
  name: string | null;
  text: string;
  style: LineStyle;
}

const KEEP = 300;

/** "대사 기록": the last few hundred lines, for a player who clicked past something. */
export class Backlog {
  private entries: Entry[] = [];
  private root: HTMLElement | null = null;

  add(name: string | null, text: string, style: LineStyle): void {
    const last = this.entries[this.entries.length - 1];
    // Cross-examination repeats statements as the player steps through them.
    if (last && last.text === text && last.name === name) return;
    this.entries.push({ name, text, style });
    if (this.entries.length > KEEP) this.entries.shift();
  }

  /** The newest lines, for the save file. */
  recent(n: number): Entry[] {
    return this.entries.slice(-n);
  }

  /** Puts a saved history back, marked so the player can see where this session picks up. */
  restore(saved: Entry[]): void {
    if (!saved.length) return;
    this.entries = [...saved, { name: null, text: '── 여기서부터 이어서 진행 ──', style: 'notice' }];
  }

  get isOpen(): boolean {
    return !!this.root;
  }

  open(stage: HTMLElement): Promise<void> {
    if (this.root) return Promise.resolve();
    const root = el('div', 'backlog', stage);
    this.root = root;
    const panel = el('div', 'backlog-panel', root);
    const head = el('header', 'backlog-head', panel);
    el('h2', 'backlog-title', head, '대사 기록');
    el('span', 'backlog-hint', head, '↑ ↓ 넘기기');
    const closeBtn = el('button', 'btn btn-small backlog-close', head, '닫기  Esc');
    const list = el('div', 'backlog-list', panel);
    if (!this.entries.length) el('p', 'backlog-empty', list, '아직 기록된 대사가 없어요.');
    for (const e of this.entries) {
      const row = el('div', `bl-row bl-${e.style}`, list);
      if (e.name) el('div', 'bl-name', row, e.name);
      const body = el('div', 'bl-text', row);
      paint(body, e.text);
    }
    list.scrollTop = list.scrollHeight;
    sfx('paper');

    return new Promise((resolve) => {
      const close = () => {
        pop();
        root.remove();
        this.root = null;
        sfx('close');
        resolve();
      };
      const pop = pushModal((a) => {
        if (a === 'back' || a === 'advance') close();
        else if (a === 'up') list.scrollBy({ top: -120 });
        else if (a === 'down') list.scrollBy({ top: 120 });
      });
      closeBtn.addEventListener('click', close);
      root.addEventListener('click', (ev) => {
        if (ev.target === root) close();
      });
    });
  }
}

/** Renders the script's {r}emphasis{/} markup and drops pause marks. */
function paint(node: HTMLElement, text: string): void {
  const parts = text.replace(/\{p\}/g, '').split(/(\{r\}|\{\/\})/);
  let em = false;
  for (const part of parts) {
    if (part === '{r}') em = true;
    else if (part === '{/}') em = false;
    else if (part) el('span', em ? 'em' : '', node, part);
  }
}
