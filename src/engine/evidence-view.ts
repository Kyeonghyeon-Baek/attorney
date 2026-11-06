import { cgImage, photoImage } from './assets';
import { sfx } from './audio';
import { el, setLabel } from './dom';
import { fromSpace, push } from './input';
import { FIGURES, paintFigure } from './figures';
import { PLATES, plateSvg } from './plates';
import { paintItem } from './portrait';
import { touchLayout } from './viewport';
import type { Evidence, EvidencePage, EvidenceVisual } from './types';

// The full-screen reading of one piece of evidence (2화): the compact card in the court record
// only says what the record is, and the source material is read here, page by page, laid out for
// what it is (a photo, a text thread, a log, a clip's frames, a paper document, a diagram).

/** A page that exists right now, with the later findings (addenda indexes) shown on it. */
export interface LaidPage {
  page: EvidencePage;
  adds: number[];
}

/** Whether a page exists yet: its own `requires`, else its part's. */
export function pageOpen(ev: Evidence, page: EvidencePage, has: (id: string) => boolean): boolean {
  const req = page.requires ?? (page.tab ? ev.tabs?.find((t) => t.id === page.tab)?.requires : undefined);
  return !req || has(req);
}

/**
 * The pages to show and where each later finding goes: on the first page whose `addenda` prefixes
 * match it, otherwise on a closing "새로 확인된 것" page. Nothing is dropped.
 */
export function layoutPages(ev: Evidence, has: (id: string) => boolean, addenda: string[]): LaidPage[] {
  const laid: LaidPage[] = (ev.pages ?? []).filter((p) => pageOpen(ev, p, has)).map((page) => ({ page, adds: [] }));
  const rest: number[] = [];
  addenda.forEach((text, k) => {
    const home = laid.find((l) => l.page.addenda?.some((pre) => text.startsWith(pre)));
    if (home) home.adds.push(k);
    else rest.push(k);
  });
  if (rest.length) laid.push({ page: { id: '_added', kind: 'document', title: '새로 확인된 것' }, adds: rest });
  // Every part still locked (a record filled in as it is found): the original text, never nothing.
  if (!laid.length) {
    laid.push({ page: {
      id: '_original', kind: 'document', title: '기록',
      ...(ev.detail.length ? { lines: ev.detail } : { caption: '아직 채워진 부분이 없어요.' }),
    }, adds: [] });
  }
  return laid;
}

/** The first page holding a finding not read yet (index ≥ seen), or -1. */
export function firstUnread(laid: LaidPage[], seen: number): number {
  return laid.findIndex((l) => l.adds.some((k) => k >= seen));
}

/**
 * The card's picture: its own cover (always shown, so it must be spoiler-safe), else the first page
 * with a picture that exists yet. A later page's picture never leaks onto the card early.
 */
export function coverOf(ev: Evidence, has: (id: string) => boolean): EvidenceVisual | undefined {
  if (ev.cover) return ev.cover;
  return ev.pages?.find((p) => (p.plate || p.image || p.cg || p.figure) && pageOpen(ev, p, has));
}

/**
 * How many addenda now count as read: the first `seen` plus every one actually shown, as far as they
 * run on without a gap (the save keeps one count, so a finding read out of order waits for the rest).
 */
export function seenCount(seen: number, shown: Set<number>, total: number): number {
  let n = seen;
  while (n < total && shown.has(n)) n++;
  return n;
}

/**
 * Paints a picture into `box`: the painted photo if it exists, else the plate drawing, the CG, the
 * figure, and finally the evidence's own item art. Returns false only when nothing but the item art fits.
 */
export function paintVisual(box: HTMLElement, v: EvidenceVisual | undefined, ev: Evidence, full = false): boolean {
  const img = (url: string) => {
    const i = el('img', 'ev-pic', box);
    i.src = url;
    i.alt = '';
    i.draggable = false;
    return true;
  };
  const photo = v?.image ? photoImage(v.image) : undefined;
  if (photo) return img(photo);
  if (v?.plate && PLATES[v.plate]) {
    // The whole photo, letterboxed: a crop could hide exactly the detail the record is about.
    box.insertAdjacentHTML('beforeend', plateSvg(v.plate, full ? 'photoplate ev-plate full' : 'photoplate ev-plate')
      .replace('xMidYMid slice', 'xMidYMid meet'));
    return true;
  }
  const cg = v?.cg ? cgImage(v.cg) : undefined;
  if (cg) return img(cg);
  if (v?.figure && FIGURES[v.figure]) {
    const fig = el('div', 'ev-figure', box);
    paintFigure(fig, v.figure);
    return true;
  }
  paintItem(el('div', 'ev-item', box), ev);
  return false;
}

/** Detail lines: "[섹션]" headings, "※" notes, "▷" quoted opinions, "02:50  …" timed rows. */
export function renderLines(parent: HTMLElement, lines: string[]): void {
  let sec = 0;
  for (const line of lines) {
    if (/^\[.+\]$/.test(line)) {
      const h = el('div', 'sec', parent, line.slice(1, -1));
      h.dataset.sec = String(sec++);
      continue;
    }
    if (line.startsWith('※')) {
      el('div', 'note', parent, line);
      continue;
    }
    if (line.startsWith('▷')) {
      el('blockquote', 'opinion', parent, line.slice(1).trim());
      continue;
    }
    const m = /^(\d\d:\d\d(?::\d\d)?(?:~\d\d(?::\d\d){0,2})?)\s{2,}(.*)$/.exec(line);
    if (!m) {
      el('div', 'row', parent, line);
      continue;
    }
    const row = el('div', 'row timed', parent);
    el('span', 'row-time', row, m[1]);
    el('span', 'row-text', row, m[2]);
  }
}

export function renderTable(parent: HTMLElement, t: { head: string[]; rows: string[][]; quiet?: number[] }): void {
  const table = el('table', 'sheet-table', parent);
  const head = el('tr', '', el('thead', '', table));
  for (const h of t.head) el('th', '', head, h);
  const body = el('tbody', '', table);
  t.rows.forEach((cells, i) => {
    const tr = el('tr', t.quiet?.includes(i) ? 'quiet' : '', body);
    for (const c of cells) el('td', '', tr, c);
  });
}

export interface ViewerOptions {
  ev: Evidence;
  laid: LaidPage[];
  addenda: string[];
  /** Addenda already read (the first n). */
  seen: number;
  start?: number;
  mode: 'view' | 'present';
  /** When presenting against a statement: shown under the title so it stays in view. */
  pin?: { label: string; text: string };
  onMap?: ((mapId: string) => Promise<unknown>) | null;
  /** Reports that the first n addenda have now been read. */
  onSeen: (n: number) => void;
}

/**
 * Opens the detail over `parent`. Resolves with what the player presented (`id` or `id#part`),
 * or null when they closed it.
 */
export function openEvidenceViewer(parent: HTMLElement, o: ViewerOptions): Promise<string | null> {
  const { ev, laid } = o;
  const root = el('div', 'evview', parent);
  root.dataset.mode = o.mode;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', `${ev.name} 자세히 보기`);
  const head = el('header', 'evview-head', root);
  const titles = el('div', 'evview-titles', head);
  el('span', 'evview-label', titles, ev.label);
  el('h2', 'evview-name', titles, ev.name);
  const pageTitle = el('div', 'evview-page', head);
  const count = el('span', 'evview-count', head);
  const closeBtn = el('button', 'btn evview-close', head, '닫기  Esc');
  if (o.pin) {
    const strip = el('div', 'record-prompt pin evview-pin', root);
    el('span', 'pin-label', strip, o.pin.label);
    el('span', 'pin-text', strip, `“${o.pin.text.replace(/\{[^}]*\}/g, '')}”`);
  }
  const main = el('div', 'evview-main', root);
  const prev = el('button', 'evview-arrow evview-prev', main, '‹');
  prev.setAttribute('aria-label', '이전 쪽');
  const body = el('section', 'evview-body', main);
  body.tabIndex = -1;
  const next = el('button', 'evview-arrow evview-next', main, '›');
  next.setAttribute('aria-label', '다음 쪽');
  const foot = el('footer', 'evview-foot', root);
  const nav = el('nav', 'evview-nav', foot);
  const presentBtn = el('button', 'btn btn-primary evview-present', foot);
  presentBtn.hidden = o.mode !== 'present';

  const shown = new Set<number>();
  let seen = o.seen;
  let at = Math.max(0, Math.min(laid.length - 1, o.start ?? 0));
  const navBtns = laid.map((l, i) => {
    const b = el('button', 'evview-tab', nav, l.page.title);
    b.addEventListener('click', () => go(i));
    return b;
  });

  // A finding counts as read once it is actually on screen, not merely on the page below the fold.
  let observer: IntersectionObserver | null = null;
  const markSeen = (k: number, node: HTMLElement) => {
    shown.add(k);
    node.classList.remove('unread');
    const n = seenCount(seen, shown, o.addenda.length);
    if (n > seen) {
      seen = n;
      o.onSeen(n);
    }
    navBtns[at]?.classList.toggle('unread', laid[at].adds.some((j) => j >= seen && !shown.has(j)));
  };
  const watch = (nodes: [number, HTMLElement][]) => {
    observer?.disconnect();
    observer = null;
    const fresh = nodes.filter(([k]) => k >= seen && !shown.has(k));
    if (!fresh.length) return;
    if (typeof IntersectionObserver === 'undefined') {
      fresh.forEach(([k, node]) => markSeen(k, node));
      return;
    }
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const hit = fresh.find(([, node]) => node === e.target);
        if (hit) markSeen(hit[0], hit[1]);
        observer?.unobserve(e.target);
      }
    }, { root: body, threshold: 0.6 });
    fresh.forEach(([, node]) => observer!.observe(node));
  };

  const render = () => {
    const { page, adds } = laid[at];
    pageTitle.textContent = page.title;
    count.textContent = laid.length > 1 ? `${at + 1} / ${laid.length}` : '';
    prev.disabled = at === 0;
    next.disabled = at === laid.length - 1;
    // A single page keeps the arrow columns (as space) so the page stays centred.
    prev.classList.toggle('gone', laid.length < 2);
    next.classList.toggle('gone', laid.length < 2);
    nav.hidden = laid.length < 2;
    navBtns.forEach((b, i) => {
      b.classList.toggle('on', i === at);
      b.setAttribute('aria-current', i === at ? 'page' : 'false');
      b.classList.toggle('unread', laid[i].adds.some((k) => k >= seen && !shown.has(k)));
    });
    const tab = page.tab ? ev.tabs?.find((t) => t.id === page.tab) : undefined;
    setLabel(presentBtn, tab ? `이 부분을 제시한다  Enter` : '이 증거를 제시한다  Enter');
    presentBtn.title = tab ? tab.label : ev.name;
    body.replaceChildren();
    body.className = `evview-body kind-${page.kind}`;
    body.scrollTop = 0;
    paintPage(body, ev, page, o.onMap, zoom);
    const nodes: [number, HTMLElement][] = [];
    if (adds.length) {
      const box = el('div', 'evview-adds', body);
      el('div', 'evview-adds-head', box, '나중에 확인된 것');
      for (const k of adds) nodes.push([k, el('div', k >= seen && !shown.has(k) ? 'addendum unread' : 'addendum', box, o.addenda[k])]);
    }
    watch(nodes);
    // Open on the first finding not read yet, so it is in view rather than under the fold.
    const unread = body.querySelector<HTMLElement>('.addendum.unread');
    if (unread && unread.offsetTop > body.clientHeight * 0.6) body.scrollTop = unread.offsetTop - 40;
  };

  // A picture on its own over the whole stage (diagram labels are small beside the text on a phone).
  // Read-only: any key, Esc or a tap goes back to the page.
  const zoom = (v: EvidenceVisual) => {
    const box = el('div', 'evview-zoom', root);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', `${laid[at].page.title} 크게 보기`);
    paintVisual(el('div', 'evview-zoom-pic', box), v, ev, true);
    el('p', 'evview-zoom-hint', box, touchLayout() ? '눌러서 닫기' : '닫기 Esc · 아무 키');
    sfx('select');
    const close = () => {
      popZoom();
      box.remove();
      if (!touchLayout()) body.focus({ preventScroll: true });
    };
    const popZoom = push(() => close(), { strict: true });
    box.addEventListener('click', close);
  };

  const go = (i: number) => {
    if (i < 0 || i >= laid.length || i === at) return;
    at = i;
    sfx('select');
    render();
  };

  // Swipe between pages on touch screens; a vertical drag still scrolls the page.
  let touch: { x: number; y: number } | null = null;
  main.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touch = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  main.addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x;
    const dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(at + (dx < 0 ? 1 : -1));
  }, { passive: true });

  render();
  sfx('paper');
  if (!touchLayout()) body.focus({ preventScroll: true });

  return new Promise((resolve) => {
    const finish = (id: string | null) => {
      observer?.disconnect();
      pop();
      root.remove();
      resolve(id);
    };
    const present = () => {
      if (o.mode !== 'present') return;
      const tab = laid[at].page.tab;
      finish(tab ? `${ev.id}#${tab}` : ev.id);
    };
    const close = () => {
      sfx('close');
      finish(null);
    };
    const pop = push((a) => {
      if (a === 'back' || a === 'record') close();
      else if (a === 'left') go(at - 1);
      else if (a === 'right' || a === 'tab') go(at + 1);
      else if (a === 'up') body.scrollBy({ top: -60 });
      else if (a === 'down') body.scrollBy({ top: 60 });
      else if (a === 'present') present();
      else if (a === 'advance') {
        // Space reads on (and closes after the last page); Enter presents when presenting.
        // After the last page Space closes when reading; when presenting it stays, so the very next
        // key can't land on the record and present by accident.
        if (o.mode === 'present' && !fromSpace()) present();
        else if (at < laid.length - 1) go(at + 1);
        else if (o.mode === 'view') close();
      } else if (/^n\d$/.test(a)) go(Number(a.slice(1)) - 1);
    }, { strict: true });
    closeBtn.addEventListener('click', close);
    presentBtn.addEventListener('click', present);
    prev.addEventListener('click', () => go(at - 1));
    next.addEventListener('click', () => go(at + 1));
  });
}

function paintPage(
  body: HTMLElement, ev: Evidence, page: EvidencePage, onMap: ((id: string) => Promise<unknown>) | null | undefined,
  zoom: (v: EvidenceVisual) => void,
): void {
  const hasPic = !!(page.plate || page.image || page.cg || page.figure);
  // A page picture that can be opened over the whole stage.
  const pic = (parent: HTMLElement, cls: string, v: EvidenceVisual = page) => {
    const box = el('div', cls, parent);
    paintVisual(box, v, ev, true);
    if (v.figure && !v.plate && !v.image && !v.cg) return box;
    box.classList.add('zoomable');
    const b = el('button', 'btn btn-small evview-zoombtn', box, '크게 보기');
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      zoom(v);
    });
    box.addEventListener('click', () => zoom(v));
    return box;
  };
  switch (page.kind) {
    case 'photo': {
      const fig = el('figure', 'evview-photo', body);
      pic(fig, 'evview-pic');
      const side = el('figcaption', 'evview-side', fig);
      if (page.caption) el('p', 'evview-caption', side, page.caption);
      if (page.lines) renderLines(el('div', 'sheet-detail evview-lines', side), page.lines);
      return;
    }
    case 'figure': {
      if (page.figure) {
        const fig = el('figure', 'evview-figure sheet-figure', body);
        paintFigure(fig, page.figure);
        const cap = page.caption ?? FIGURES[page.figure]?.caption;
        if (cap) el('figcaption', '', fig, cap);
      } else if (hasPic) pic(body, 'evview-pic');
      if (page.lines) renderLines(el('div', 'sheet-detail evview-lines', body), page.lines);
      return;
    }
    case 'map': {
      if (page.caption) el('p', 'evview-caption', body, page.caption);
      if (page.lines) renderLines(el('div', 'sheet-detail evview-lines', body), page.lines);
      if (page.map && onMap) {
        const mapId = page.map;
        const b = el('button', 'btn evview-mapbtn', body, '평면도 크게 보기');
        b.addEventListener('click', () => void onMap(mapId));
      }
      if (hasPic) pic(body, 'evview-pic small');
      return;
    }
    case 'messages': {
      if (page.caption) el('p', 'evview-caption', body, page.caption);
      const thread = el('div', 'evview-thread', body);
      for (const m of page.messages ?? []) {
        const row = el('div', `msg${m.mine ? ' mine' : ''}`, thread);
        const meta = el('div', 'msg-meta', row);
        el('span', 'msg-from', meta, m.from);
        el('span', 'msg-at', meta, m.at);
        el('div', 'msg-bubble', row, m.text);
        if (m.note) el('div', 'msg-note', row, m.note);
      }
      if (page.lines) renderLines(el('div', 'sheet-detail evview-lines', body), page.lines);
      return;
    }
    case 'table': {
      if (page.caption) el('p', 'evview-caption', body, page.caption);
      const box = el('div', 'sheet-detail evview-lines', body);
      if (page.table) renderTable(box, page.table);
      if (page.lines) renderLines(box, page.lines);
      return;
    }
    case 'frames': {
      if (page.caption) el('p', 'evview-caption', body, page.caption);
      if (hasPic) pic(body, 'evview-pic wide');
      const strip = el('ol', 'evview-frames', body);
      for (const f of page.frames ?? []) {
        const li = el('li', 'frame', strip);
        if (f.plate || f.image) pic(li, 'frame-pic', f);
        el('span', 'frame-at', li, f.at);
        el('span', 'frame-text', li, f.text);
      }
      if (page.lines) renderLines(el('div', 'sheet-detail evview-lines', body), page.lines);
      return;
    }
    case 'document': {
      // A page that only holds later findings (a reply that came in) has no paper of its own.
      if (!page.caption && !hasPic && !page.table && !page.lines?.length) return;
      const paper = el('div', 'evview-paper', body);
      if (page.caption) el('p', 'evview-caption', paper, page.caption);
      if (hasPic) pic(paper, 'evview-pic small');
      if (page.table) renderTable(paper, page.table);
      if (page.lines) renderLines(el('div', 'sheet-detail evview-lines', paper), page.lines);
      return;
    }
  }
}
