import { sfx } from './audio';
import { el, replay, scrollWithin } from './dom';
import { fromSpace, push } from './input';
import { FIGURES, paintFigure } from './figures';
import { paintCompare } from './photos';
import { paintFace, paintItem } from './portrait';
import type { Evidence, Profile } from './types';

type Tab = 'evidence' | 'profiles' | 'memo';

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
  private hintBtn: HTMLButtonElement;
  private tab: Tab = 'evidence';
  /** -1 = nothing chosen yet (presenting always starts that way). */
  private sel = 0;
  private mode: 'view' | 'present' = 'view';
  private finish: ((id: string | null) => void) | null = null;
  private owned = new Set<string>();
  /** Later findings shown under an evidence's original text, oldest first. */
  private addenda = new Map<string, string[]>();
  /** Items the player has opened, and how many of each item's addenda they have scrolled to. */
  private viewed = new Set<string>();
  private addendaSeen = new Map<string, number>();
  private observer: IntersectionObserver | null = null;
  /** Opens an evidence's map full screen; set by the game. */
  onMap: ((mapId: string) => Promise<unknown>) | null = null;
  /** Opens a photo set full screen; set by the game. */
  onPhotos: ((setId: string) => Promise<unknown>) | null = null;
  /** Whether a photo set's matched corner may be ringed yet (after the expert result). */
  photoMarked: (setId: string) => boolean = () => false;
  /** Persists what has been read: (id, addenda read). */
  onSeen: ((id: string, n: number) => void) | null = null;
  /** Opens the hint window for the current question; null hides the button. */
  onHint: (() => void) | null = null;
  /** 강단비's notebook lines, newest last; set by the game. The tab shows up once there is one. */
  memos: () => string[] = () => [];
  private body: HTMLElement;
  private promptText = '';
  /** Where the player left the record when only reading it, to come back to the same page. */
  private lastView: { tab: Tab; id: string; scroll: number } | null = null;

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
    this.hintBtn = el('button', 'btn record-hint', foot, '힌트  H');
    this.presentBtn = el('button', 'btn btn-primary', foot, '이 증거를 제시한다  Enter');
    this.closeBtn.addEventListener('click', () => this.close(null));
    this.presentBtn.addEventListener('click', () => this.presentSelected());
    this.hintBtn.addEventListener('click', () => this.onHint?.());
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

  /** Adds a later finding under a piece of evidence; the same line is only added once. */
  annotate(id: string, text: string): void {
    const lines = this.addenda.get(id) ?? [];
    if (!lines.includes(text)) lines.push(text);
    this.addenda.set(id, lines);
  }

  /** Puts back what a save says was already read. */
  restoreSeen(id: string, n: number): void {
    this.viewed.add(id);
    this.addendaSeen.set(id, Math.max(n, this.addendaSeen.get(id) ?? 0));
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

  /** Evidence the player holds: by shelf when the case has shelves, otherwise in case-file order. */
  private get held(): Evidence[] {
    const held = this.evidence.filter((e) => this.owned.has(e.id));
    const order = [...new Set(this.evidence.map((e) => e.group ?? ''))];
    return held.sort((a, b) => order.indexOf(a.group ?? '') - order.indexOf(b.group ?? ''));
  }

  private memoUnread(): number {
    return Math.max(0, this.memos().length - (this.addendaSeen.get('memo') ?? 0));
  }

  private get people(): Profile[] {
    return this.profiles.filter((p) => this.owned.has(p.id));
  }

  private badge(id: string): '' | '새로' | '갱신' {
    if (!this.viewed.has(id)) return '새로';
    const n = this.addenda.get(id)?.length ?? 0;
    return n > (this.addendaSeen.get(id) ?? 0) ? '갱신' : '';
  }

  /**
   * `pin` keeps the statement being contradicted in view while the player reads evidence.
   * `focus` opens on that evidence, scrolled to its newest unread addendum.
   */
  open(
    mode: 'view' | 'present',
    prompt = '',
    cancellable = true,
    pin?: { label: string; text: string },
    focus?: string,
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
    this.promptText = prompt;
    this.prompt.hidden = !prompt && !pin;
    this.closeBtn.hidden = !cancellable;
    this.hintBtn.hidden = !this.onHint;
    this.tab = 'evidence';
    // Presenting starts with nothing chosen, so a stray Enter can never present by itself.
    this.sel = mode === 'present' ? -1 : 0;
    let scroll = 0;
    const back = mode === 'view' && !focus ? this.lastView : null;
    if (back) {
      const list: { id: string }[] = back.tab === 'profiles' ? this.people : this.held;
      const i = list.findIndex((x) => x.id === back.id);
      if (back.tab === 'memo' || i >= 0) {
        this.tab = back.tab;
        this.sel = Math.max(0, i);
        scroll = back.scroll;
      }
    }
    if (focus) {
      const i = this.held.findIndex((e) => e.id === focus);
      if (i >= 0) this.sel = i;
    }
    this.render();
    // Once the sheet is laid out (a timer, not a frame: frames pause in a background tab).
    setTimeout(() => {
      if (focus) this.scrollToUnread();
      else if (scroll) this.sheet.scrollTop = scroll;
    }, 30);
    sfx('paper');
    return new Promise((resolve) => {
      const pop = push((a) => {
        if (a === 'back' && cancellable) this.close(null);
        else if (a === 'record' && mode === 'view') this.close(null);
        // Space is for the large map or photo view, so presenting always takes Enter (or E).
        else if (a === 'advance' && fromSpace()) this.openExtra();
        else if ((a === 'advance' || a === 'present') && mode === 'present') this.presentSelected();
        else if (a === 'advance' && mode === 'view') this.openExtra();
        else if (a === 'tab') this.setTab(this.nextTab());
        else if (a === 'left') this.move(-1);
        else if (a === 'right') this.move(1);
        else if (a === 'up') this.moveRow(-1);
        else if (a === 'down') this.moveRow(1);
      }, { strict: true });
      this.finish = (id) => {
        if (this.mode === 'view') {
          const cur = this.tab === 'memo' ? { id: '' } : this.tab === 'evidence' ? this.held[this.sel] : this.people[this.sel];
          this.lastView = cur ? { tab: this.tab, id: cur.id, scroll: this.sheet.scrollTop } : null;
        }
        pop();
        this.observer?.disconnect();
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
    if (picked) {
      this.finish?.(picked.id);
      return;
    }
    // Nothing chosen: say how to choose instead of presenting.
    this.prompt.hidden = false;
    if (!this.prompt.querySelector('.pin-label')) this.prompt.textContent = this.promptText || '';
    const n = el('span', 'record-nudge', this.prompt, '  ← → 나 클릭으로 증거를 먼저 고르세요');
    replay(n, 'on');
    setTimeout(() => n.remove(), 1600);
  }

  /** Space (and Enter in view mode) opens the selected evidence's map or photos, if it has one. */
  private openExtra(): void {
    const ev = this.tab === 'evidence' ? this.held[this.sel] : undefined;
    if (ev?.map) void this.onMap?.(ev.map);
    else if (ev?.photos) void this.onPhotos?.(ev.photos);
  }

  private setTab(t: Tab): void {
    if (t === this.tab) return;
    this.tab = t;
    this.sel = this.mode === 'present' ? -1 : 0;
    sfx('select');
    this.render();
  }

  private move(d: number): void {
    if (this.tab === 'memo') {
      this.sheet.scrollBy({ top: d * 40 });
      return;
    }
    const n = this.tab === 'evidence' ? this.held.length : this.people.length;
    if (!n) return;
    const next = this.sel < 0 ? 0 : this.sel + d;
    if (next < 0 || next >= n) return;
    this.sel = next;
    sfx('select');
    this.render();
  }

  /** Up and down follow the tiles on screen, which shelf headings break into uneven rows. */
  private moveRow(dir: 1 | -1): void {
    if (this.tab === 'memo') {
      this.move(dir);
      return;
    }
    const tiles = [...this.grid.querySelectorAll<HTMLElement>('.tile')];
    if (!tiles.length) return;
    if (this.sel < 0) {
      this.move(1);
      return;
    }
    const cur = tiles[this.sel];
    const below = tiles.filter((t) => (dir > 0 ? t.offsetTop > cur.offsetTop + 4 : t.offsetTop < cur.offsetTop - 4));
    if (!below.length) return;
    const tops = below.map((t) => t.offsetTop);
    const rowTop = dir > 0 ? Math.min(...tops) : Math.max(...tops);
    const row = below.filter((t) => Math.abs(t.offsetTop - rowTop) < 4);
    const best = row.reduce((a, b) => (Math.abs(b.offsetLeft - cur.offsetLeft) < Math.abs(a.offsetLeft - cur.offsetLeft) ? b : a));
    this.sel = tiles.indexOf(best);
    sfx('select');
    this.render();
    const tile = this.grid.querySelectorAll('.tile')[this.sel];
    if (tile) scrollWithin(this.grid, tile, 'nearest');
  }

  private render(): void {
    for (const t of ['evidence', 'profiles', 'memo'] as Tab[]) {
      this.tabBtns[t].classList.toggle('on', t === this.tab);
    }
    this.tabBtns.memo.hidden = this.memos().length === 0;
    const unread = this.tab === 'memo' ? 0 : this.memoUnread();
    this.tabBtns.memo.textContent = unread ? `메모 ${unread}` : '메모';
    this.tabBtns.memo.classList.toggle('unread', unread > 0);
    if (this.tab === 'memo' && this.tabBtns.memo.hidden) this.tab = 'evidence';
    this.body.classList.toggle('memo-mode', this.tab === 'memo');
    this.presentBtn.hidden = this.mode !== 'present' || this.tab === 'memo';
    if (this.tab === 'memo') {
      this.grid.replaceChildren();
      this.renderMemo();
      return;
    }
    const items = this.tab === 'evidence' ? this.held : this.people;
    if (this.sel >= items.length) this.sel = items.length - 1;
    this.presentBtn.disabled = this.sel < 0;
    this.presentBtn.textContent = this.tab === 'evidence' ? '이 증거를 제시한다  Enter' : '이 인물을 제시한다  Enter';
    this.grid.replaceChildren();
    let shelf: string | undefined;
    items.forEach((item, i) => {
      const g = 'icon' in item ? item.group : undefined;
      if (g && g !== shelf) el('div', 'grid-shelf', this.grid, g);
      shelf = g;
      const tile = el('button', 'tile', this.grid);
      tile.classList.toggle('on', i === this.sel);
      if ('icon' in item) paintItem(el('span', 'tile-pic', tile), item);
      else paintFace(el('span', 'face', tile), item);
      el('span', 'tile-name', tile, item.name);
      const b = 'icon' in item ? this.badge(item.id) : '';
      if (b) el('span', `tile-badge ${b === '갱신' ? 'upd' : 'new'}`, tile, b);
      tile.addEventListener('click', () => {
        // A click chooses; presenting takes the button, Enter, or a second click on the same item.
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
    const n = this.memos().length;
    if ((this.addendaSeen.get('memo') ?? 0) < n) {
      this.addendaSeen.set('memo', n);
      this.onSeen?.('memo', n);
    }
    this.sheet.replaceChildren();
    el('div', 'sheet-label', this.sheet, '강단비의 수첩');
    el('h2', 'sheet-title', this.sheet, '지금까지 알게 된 것');
    const list = el('ol', 'memo-list', this.sheet);
    for (const line of this.memos()) el('li', '', list, line);
  }

  private scrollToUnread(): void {
    const target = this.sheet.querySelector('.addendum.unread') ?? this.sheet.querySelector('.addendum:last-of-type');
    if (target) scrollWithin(this.sheet, target, 'center');
  }

  private renderSheet(): void {
    this.observer?.disconnect();
    this.sheet.replaceChildren();
    if (this.tab === 'evidence') {
      const ev = this.held[this.sel];
      if (!ev) {
        el('p', 'sheet-empty', this.sheet, this.held.length
          ? '왼쪽에서 증거를 고르면 내용이 보여요. (← → 또는 클릭)'
          : '아직 모은 증거가 없어요.');
        return;
      }
      const wasNew = !this.viewed.has(ev.id);
      this.viewed.add(ev.id);
      const top = el('div', 'sheet-top', this.sheet);
      paintItem(el('div', 'sheet-icon', top), ev);
      const titles = el('div', '', top);
      el('div', 'sheet-label', titles, ev.label);
      el('h2', 'sheet-title', titles, ev.name);
      const adds = this.addenda.get(ev.id) ?? [];
      const seen = this.addendaSeen.get(ev.id) ?? 0;
      if (adds.length > seen) {
        const pill = el('button', 'sheet-upd', titles, `갱신 ${adds.length - seen}건 · 보기`);
        pill.addEventListener('click', () => this.scrollToUnread());
      }
      el('p', 'sheet-summary', this.sheet, ev.summary);
      if (ev.figure && FIGURES[ev.figure]) {
        const fig = el('figure', 'sheet-figure', this.sheet);
        paintFigure(fig, ev.figure);
        if (FIGURES[ev.figure].caption) el('figcaption', '', fig, FIGURES[ev.figure].caption!);
      }
      if (ev.source || ev.proves || ev.limits) {
        const scope = el('dl', 'sheet-scope', this.sheet);
        if (ev.source) {
          el('dt', '', scope, '출처');
          el('dd', '', scope, ev.source);
        }
        if (ev.proves?.length) {
          el('dt', '', scope, '확인되는 것');
          el('dd', '', scope, ev.proves.join(' · '));
        }
        if (ev.limits?.length) {
          el('dt', 'lim', scope, '이것만으로는 알 수 없는 것');
          el('dd', 'lim', scope, ev.limits.join(' · '));
        }
      }
      if (ev.map && this.onMap) {
        const mapId = ev.map;
        const b = el('button', 'btn sheet-map', this.sheet, '평면도 크게 보기  Space');
        b.addEventListener('click', () => void this.onMap?.(mapId));
      }
      if (ev.photos) {
        const setId = ev.photos;
        paintCompare(this.sheet, setId, this.photoMarked(setId));
        if (this.onPhotos) {
          const b = el('button', 'btn sheet-map', this.sheet, '사진 크게 비교 · 전체 목록  Space');
          b.addEventListener('click', () => void this.onPhotos?.(setId));
        }
      }
      // Sections ("[골목 · 02:52~03:14]") get jump buttons when there are several.
      const sections = ev.detail.filter((l) => /^\[.+\]$/.test(l));
      if (sections.length > 1) {
        const nav = el('div', 'sheet-nav', this.sheet);
        sections.forEach((s, k) => {
          const b = el('button', 'btn btn-small', nav, s.slice(1, -1));
          b.addEventListener('click', () => {
            const sec = this.sheet.querySelector(`[data-sec="${k}"]`);
            if (sec) scrollWithin(this.sheet, sec, 'start');
          });
        });
      }
      const detail = el('div', 'sheet-detail', this.sheet);
      if (ev.table) renderTable(detail, ev.table);
      let sec = 0;
      for (const line of ev.detail) {
        if (/^\[.+\]$/.test(line)) {
          const h = el('div', 'sec', detail, line.slice(1, -1));
          h.dataset.sec = String(sec++);
          continue;
        }
        if (line.startsWith('※')) {
          el('div', 'note', detail, line);
          continue;
        }
        if (line.startsWith('▷')) {
          // A quoted opinion (e.g. the police's first reading), kept apart from the record itself.
          el('blockquote', 'opinion', detail, line.slice(1).trim());
          continue;
        }
        // "02:50  text" or "02:05~02:50:20  text": the time gets its own column.
        const m = /^(\d\d:\d\d(?::\d\d)?(?:~\d\d:\d\d(?::\d\d)?)?)\s{2,}(.*)$/.exec(line);
        if (!m) {
          el('div', 'row', detail, line);
          continue;
        }
        const row = el('div', 'row timed', detail);
        el('span', 'row-time', row, m[1]);
        el('span', 'row-text', row, m[2]);
      }
      // Findings added during the trial, set apart so the original record still reads as it was.
      adds.forEach((line, k) => {
        const a = el('div', k >= seen ? 'addendum unread' : 'addendum', detail, line);
        a.dataset.k = String(k);
      });
      if (adds.length > seen) {
        const last = detail.querySelector('.addendum:last-of-type');
        const id = ev.id;
        this.observer = new IntersectionObserver((entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          this.addendaSeen.set(id, adds.length);
          this.onSeen?.(id, adds.length);
          this.observer?.disconnect();
          // Repaint the tiles so the "갱신" badge goes away, keeping the scroll position.
          this.grid.querySelectorAll('.tile')[this.sel]?.querySelector('.tile-badge')?.remove();
          this.sheet.querySelector('.sheet-upd')?.remove();
        }, { root: this.sheet, threshold: 0.6 });
        if (last) this.observer.observe(last);
      } else if (wasNew) this.onSeen?.(ev.id, seen);
      if (wasNew) this.grid.querySelectorAll('.tile')[this.sel]?.querySelector('.tile-badge.new')?.remove();
    } else {
      const p = this.people[this.sel];
      if (!p) {
        el('p', 'sheet-empty', this.sheet, '왼쪽에서 인물을 고르면 내용이 보여요.');
        return;
      }
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
