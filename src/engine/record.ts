import { sfx } from './audio';
import { el } from './dom';
import { icon } from './icons';
import { push } from './input';
import type { Evidence, Profile } from './types';

type Tab = 'evidence' | 'profiles';
const COLS = 3;

/** The court record, drawn as a bound Korean case file. */
export class CourtRecord {
  private root: HTMLElement;
  private tabBtns: Record<Tab, HTMLButtonElement>;
  private grid: HTMLElement;
  private sheet: HTMLElement;
  private prompt: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private presentBtn: HTMLButtonElement;
  private tab: Tab = 'evidence';
  private sel = 0;
  private mode: 'view' | 'present' = 'view';
  private finish: ((id: string | null) => void) | null = null;
  private owned = new Set<string>();

  constructor(
    parent: HTMLElement,
    private evidence: Evidence[],
    private profiles: Profile[],
    caseNo: string,
    caseName: string,
  ) {
    this.root = el('div', 'record', parent);
    this.root.hidden = true;
    const folder = el('div', 'folder', this.root);
    const tabs = el('div', 'folder-tabs', folder);
    this.tabBtns = {
      evidence: el('button', 'folder-tab', tabs, '증거'),
      profiles: el('button', 'folder-tab', tabs, '인물'),
    };
    for (const t of ['evidence', 'profiles'] as Tab[]) {
      this.tabBtns[t].addEventListener('click', () => this.setTab(t));
    }
    const head = el('header', 'folder-head', folder);
    el('div', 'case-no', head, caseNo);
    el('div', 'case-name', head, caseName);
    this.prompt = el('div', 'record-prompt', folder);
    const body = el('div', 'folder-body', folder);
    this.grid = el('div', 'grid', body);
    this.sheet = el('article', 'sheet', body);
    const foot = el('footer', 'folder-foot', folder);
    this.closeBtn = el('button', 'btn', foot, '닫기  Esc');
    this.presentBtn = el('button', 'btn btn-primary', foot, '이 증거를 제시한다  Enter');
    this.closeBtn.addEventListener('click', () => this.close(null));
    this.presentBtn.addEventListener('click', () => this.presentSelected());
  }

  get(id: string): Evidence | undefined {
    return this.evidence.find((e) => e.id === id);
  }

  has(id: string): boolean {
    return this.owned.has(id);
  }

  add(id: string): void {
    this.owned.add(id);
  }

  ownAll(): void {
    this.evidence.forEach((e) => this.owned.add(e.id));
  }

  /** Evidence the player holds, in case-file order. */
  private get held(): Evidence[] {
    return this.evidence.filter((e) => this.owned.has(e.id));
  }

  open(mode: 'view' | 'present', prompt = '', cancellable = true): Promise<string | null> {
    this.mode = mode;
    this.root.hidden = false;
    this.root.dataset.mode = mode;
    this.prompt.textContent = prompt;
    this.prompt.hidden = !prompt;
    this.closeBtn.hidden = !cancellable;
    this.tab = 'evidence';
    this.render();
    sfx('open');
    return new Promise((resolve) => {
      const pop = push((a) => {
        if (a === 'back' && cancellable) this.close(null);
        else if (a === 'record' && mode === 'view') this.close(null);
        else if ((a === 'advance' || a === 'present') && mode === 'present') this.presentSelected();
        else if (a === 'tab') this.setTab(this.tab === 'evidence' ? 'profiles' : 'evidence');
        else if (a === 'left') this.move(-1);
        else if (a === 'right') this.move(1);
        else if (a === 'up') this.move(-COLS);
        else if (a === 'down') this.move(COLS);
      });
      this.finish = (id) => {
        pop();
        this.root.hidden = true;
        this.finish = null;
        resolve(id);
      };
    });
  }

  private close(id: string | null): void {
    sfx('close');
    this.finish?.(id);
  }

  private presentSelected(): void {
    if (this.mode !== 'present' || this.tab !== 'evidence') return;
    const ev = this.held[this.sel];
    if (ev) this.finish?.(ev.id);
  }

  private setTab(t: Tab): void {
    if (t === this.tab) return;
    this.tab = t;
    this.sel = 0;
    sfx('select');
    this.render();
  }

  private move(d: number): void {
    const n = this.tab === 'evidence' ? this.held.length : this.profiles.length;
    const next = this.sel + d;
    if (next < 0 || next >= n) return;
    this.sel = next;
    sfx('select');
    this.render();
  }

  private render(): void {
    for (const t of ['evidence', 'profiles'] as Tab[]) {
      this.tabBtns[t].classList.toggle('on', t === this.tab);
    }
    this.presentBtn.hidden = this.mode !== 'present';
    const items = this.tab === 'evidence' ? this.held : this.profiles;
    if (this.sel >= items.length) this.sel = Math.max(0, items.length - 1);
    this.presentBtn.disabled = this.tab !== 'evidence' || items.length === 0;
    this.grid.replaceChildren();
    items.forEach((item, i) => {
      const tile = el('button', 'tile', this.grid);
      tile.classList.toggle('on', i === this.sel);
      if ('icon' in item) tile.innerHTML = icon(item.icon);
      else {
        const face = el('span', 'face', tile, item.name[0]);
        face.style.setProperty('--face', item.color);
      }
      el('span', 'tile-name', tile, item.name);
      tile.addEventListener('click', () => {
        if (this.sel === i && this.mode === 'present') {
          this.presentSelected();
          return;
        }
        this.sel = i;
        sfx('select');
        this.render();
      });
    });
    this.renderSheet();
  }

  private renderSheet(): void {
    this.sheet.replaceChildren();
    if (this.tab === 'evidence') {
      const ev = this.held[this.sel];
      if (!ev) {
        el('p', 'sheet-empty', this.sheet, '아직 모은 증거가 없어요. 조사하면서 찾아보세요.');
        return;
      }
      const top = el('div', 'sheet-top', this.sheet);
      const ic = el('div', 'sheet-icon', top);
      ic.innerHTML = icon(ev.icon);
      const titles = el('div', '', top);
      el('div', 'sheet-label', titles, ev.label);
      el('h2', 'sheet-title', titles, ev.name);
      el('p', 'sheet-summary', this.sheet, ev.summary);
      const detail = el('div', 'sheet-detail', this.sheet);
      for (const line of ev.detail) {
        el('div', line.startsWith('※') ? 'note' : 'row', detail, line);
      }
    } else {
      const p = this.profiles[this.sel];
      if (!p) return;
      const top = el('div', 'sheet-top', this.sheet);
      const face = el('div', 'sheet-face', top, p.name[0]);
      face.style.setProperty('--face', p.color);
      const titles = el('div', '', top);
      el('div', 'sheet-label', titles, p.meta);
      el('h2', 'sheet-title', titles, p.name);
      el('p', 'sheet-summary', this.sheet, p.summary);
    }
  }
}
