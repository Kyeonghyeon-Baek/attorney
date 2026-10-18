import { sfx } from './audio';
import { el } from './dom';
import { push } from './input';
import { paintFace, paintItem } from './portrait';
import type { Evidence, Profile } from './types';

type Tab = 'evidence' | 'profiles' | 'memo';
const COLS = 3;

/** Something held up in court: a piece of evidence or a person's profile. */
export interface HeldItem {
  name: string;
  evidence?: Evidence;
  profile?: Profile;
}

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
  /** Opens an evidence's map full screen; set by the game. */
  onMap: ((mapId: string) => Promise<unknown>) | null = null;
  /** 강단비's notebook lines, newest last; set by the game. The tab shows up once there is one. */
  memos: () => string[] = () => [];
  private body: HTMLElement;

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
      memo: el('button', 'folder-tab', tabs, '메모'),
    };
    for (const t of ['evidence', 'profiles', 'memo'] as Tab[]) {
      this.tabBtns[t].addEventListener('click', () => this.setTab(t));
    }
    const head = el('header', 'folder-head', folder);
    el('div', 'case-no', head, caseNo);
    el('div', 'case-name', head, caseName);
    this.prompt = el('div', 'record-prompt', folder);
    const body = el('div', 'folder-body', folder);
    this.body = body;
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

  getProfile(id: string): Profile | undefined {
    return this.profiles.find((p) => p.id === id);
  }

  item(id: string | null): HeldItem | null {
    if (!id) return null;
    const ev = this.get(id);
    if (ev) return { name: ev.name, evidence: ev };
    const p = this.getProfile(id);
    return p ? { name: p.name, profile: p } : null;
  }

  /** Updates an entry's summary in place; the change lasts for this session. */
  revise(id: string, summary: string): void {
    const entry = this.get(id) ?? this.getProfile(id);
    if (entry) entry.summary = summary;
  }

  has(id: string): boolean {
    return this.owned.has(id);
  }

  add(id: string): void {
    this.owned.add(id);
  }

  ownAll(): void {
    this.evidence.forEach((e) => this.owned.add(e.id));
    this.profiles.forEach((p) => this.owned.add(p.id));
  }

  /** Ids held, evidence and profiles alike, for saving. */
  get ownedIds(): string[] {
    return [...this.evidence, ...this.profiles].map((x) => x.id).filter((id) => this.owned.has(id));
  }

  /** Evidence the player holds, in case-file order. */
  private get held(): Evidence[] {
    return this.evidence.filter((e) => this.owned.has(e.id));
  }

  private get people(): Profile[] {
    return this.profiles.filter((p) => this.owned.has(p.id));
  }

  /**
   * `pin` keeps the statement being contradicted in view while the player reads evidence.
   */
  open(
    mode: 'view' | 'present',
    prompt = '',
    cancellable = true,
    pin?: { label: string; text: string },
  ): Promise<string | null> {
    this.mode = mode;
    this.root.hidden = false;
    this.root.dataset.mode = mode;
    this.prompt.replaceChildren();
    this.prompt.classList.toggle('pin', !!pin);
    if (pin) {
      el('span', 'pin-label', this.prompt, pin.label);
      el('span', 'pin-text', this.prompt, `“${pin.text.replace(/\{[^}]*\}/g, '')}”`);
    } else this.prompt.textContent = prompt;
    this.prompt.hidden = !prompt && !pin;
    this.closeBtn.hidden = !cancellable;
    this.tab = 'evidence';
    this.render();
    sfx('paper');
    return new Promise((resolve) => {
      const pop = push((a) => {
        if (a === 'back' && cancellable) this.close(null);
        else if (a === 'record' && mode === 'view') this.close(null);
        else if ((a === 'advance' || a === 'present') && mode === 'present') this.presentSelected();
        else if (a === 'advance' && mode === 'view') this.openMap();
        else if (a === 'tab') this.setTab(this.nextTab());
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

  private nextTab(): Tab {
    if (this.tab === 'evidence') return 'profiles';
    if (this.tab === 'profiles' && this.memos().length) return 'memo';
    return 'evidence';
  }

  private presentSelected(): void {
    if (this.mode !== 'present' || this.tab === 'memo') return;
    const picked = this.tab === 'evidence' ? this.held[this.sel] : this.people[this.sel];
    if (picked) this.finish?.(picked.id);
  }

  /** In view mode, Space opens the selected evidence's map, if it has one. */
  private openMap(): void {
    const ev = this.tab === 'evidence' ? this.held[this.sel] : undefined;
    if (ev?.map) void this.onMap?.(ev.map);
  }

  private setTab(t: Tab): void {
    if (t === this.tab) return;
    this.tab = t;
    this.sel = 0;
    sfx('select');
    this.render();
  }

  private move(d: number): void {
    if (this.tab === 'memo') {
      this.sheet.scrollBy({ top: d * 40 });
      return;
    }
    const n = this.tab === 'evidence' ? this.held.length : this.people.length;
    const next = this.sel + d;
    if (next < 0 || next >= n) return;
    this.sel = next;
    sfx('select');
    this.render();
  }

  private render(): void {
    for (const t of ['evidence', 'profiles', 'memo'] as Tab[]) {
      this.tabBtns[t].classList.toggle('on', t === this.tab);
    }
    this.tabBtns.memo.hidden = this.memos().length === 0;
    if (this.tab === 'memo' && this.tabBtns.memo.hidden) this.tab = 'evidence';
    this.body.classList.toggle('memo-mode', this.tab === 'memo');
    this.presentBtn.hidden = this.mode !== 'present' || this.tab === 'memo';
    if (this.tab === 'memo') {
      this.grid.replaceChildren();
      this.renderMemo();
      return;
    }
    const items = this.tab === 'evidence' ? this.held : this.people;
    if (this.sel >= items.length) this.sel = Math.max(0, items.length - 1);
    this.presentBtn.disabled = items.length === 0;
    this.presentBtn.textContent = this.tab === 'evidence' ? '이 증거를 제시한다  Enter' : '이 인물을 제시한다  Enter';
    this.grid.replaceChildren();
    items.forEach((item, i) => {
      const tile = el('button', 'tile', this.grid);
      tile.classList.toggle('on', i === this.sel);
      if ('icon' in item) paintItem(el('span', 'tile-pic', tile), item);
      else paintFace(el('span', 'face', tile), item);
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

  private renderMemo(): void {
    this.sheet.replaceChildren();
    el('div', 'sheet-label', this.sheet, '강단비의 수첩');
    el('h2', 'sheet-title', this.sheet, '지금까지 알게 된 것');
    const list = el('ol', 'memo-list', this.sheet);
    for (const line of this.memos()) el('li', '', list, line);
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
      paintItem(el('div', 'sheet-icon', top), ev);
      const titles = el('div', '', top);
      el('div', 'sheet-label', titles, ev.label);
      el('h2', 'sheet-title', titles, ev.name);
      el('p', 'sheet-summary', this.sheet, ev.summary);
      if (ev.map && this.onMap) {
        const mapId = ev.map;
        const b = el('button', 'btn sheet-map', this.sheet, '평면도 크게 보기  Space');
        b.addEventListener('click', () => void this.onMap?.(mapId));
      }
      const detail = el('div', 'sheet-detail', this.sheet);
      if (ev.table) renderTable(detail, ev.table);
      for (const line of ev.detail) {
        if (line.startsWith('※')) {
          el('div', 'note', detail, line);
          continue;
        }
        // "02:50  text" or "02:05~02:50  text": the time gets its own column.
        const m = /^(\d\d:\d\d(?::\d\d)?(?:~\d\d:\d\d)?)\s{2,}(.*)$/.exec(line);
        if (!m) {
          el('div', 'row', detail, line);
          continue;
        }
        const row = el('div', 'row timed', detail);
        el('span', 'row-time', row, m[1]);
        el('span', 'row-text', row, m[2]);
      }
    } else {
      const p = this.people[this.sel];
      if (!p) return;
      const top = el('div', 'sheet-top', this.sheet);
      paintFace(el('div', 'sheet-face', top), p);
      const titles = el('div', '', top);
      el('div', 'sheet-label', titles, p.meta);
      el('h2', 'sheet-title', titles, p.name);
      el('p', 'sheet-summary', this.sheet, p.summary);
    }
  }
}

function renderTable(parent: HTMLElement, t: NonNullable<Evidence['table']>): void {
  const table = el('table', 'sheet-table', parent);
  const head = el('tr', '', el('thead', '', table));
  for (const h of t.head) el('th', '', head, h);
  const body = el('tbody', '', table);
  t.rows.forEach((cells, i) => {
    const tr = el('tr', t.quiet?.includes(i) ? 'quiet' : '', body);
    for (const c of cells) el('td', '', tr, c);
  });
}
