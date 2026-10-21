import { cgImage, itemImage } from './assets';
import { sfx } from './audio';
import { el, replay, sleep } from './dom';
import { FIGURES, figureSvg, paintFigure, type FigureMark } from './figures';
import { MAPS } from './maps';
import type { BoardRow, DetectBox, PanelCard, PlanRoute } from './types';

const BARS = 56;

/**
 * Layers that sit over the scene but under the text box: event illustrations,
 * a security-camera view with the store AI's detection boxes, and a tape player
 * for recordings. Any of them hides the courtroom HUD while it is up.
 */
export class Cinema {
  private cg: HTMLElement;
  private cctv: HTMLElement;
  private cam: HTMLElement;
  private clock: HTMLElement;
  private status: HTMLElement;
  private boxes: HTMLElement;
  private tape: HTMLElement;
  private tapeImg: HTMLImageElement | null = null;
  private tapeTitle: HTMLElement;
  private tapeClock: HTMLElement;
  private wave: HTMLElement;
  private bars: HTMLElement[] = [];
  private date = '';
  private secs = 0;
  private timer = 0;
  private waveTimer = 0;
  private black: HTMLElement;
  private board: HTMLElement;
  private boardTitle: HTMLElement;
  private boardRows: HTMLElement;
  private shownRows = new Set<string>();
  private plan: HTMLElement;
  private panel: HTMLElement;
  private figure: HTMLElement;
  /** Draws a card's picture ('profile:…', 'item:…'); set by the game, which knows the case's people and records. */
  paintCard: ((box: HTMLElement, img: string) => void) | null = null;

  constructor(private stage: HTMLElement, private fast = false) {
    this.cg = el('div', 'cg', stage);
    this.cg.hidden = true;

    this.cctv = el('div', 'cctv', stage);
    this.cctv.hidden = true;
    el('div', 'cctv-noise', this.cctv);
    this.boxes = el('div', 'cctv-boxes', this.cctv);
    const top = el('div', 'cctv-top', this.cctv);
    const rec = el('div', 'cctv-rec', top);
    el('i', '', rec);
    el('span', '', rec, 'REC');
    this.cam = el('span', 'cctv-cam', rec);
    this.clock = el('div', 'cctv-clock', top);
    this.status = el('div', 'cctv-status', this.cctv);
    for (const c of ['tl', 'tr', 'bl', 'br']) el('i', `cctv-corner ${c}`, this.cctv);

    this.tape = el('div', 'tape', stage);
    this.tape.hidden = true;
    const deck = el('div', 'tape-deck', this.tape);
    const device = el('div', 'tape-device', deck);
    const pic = itemImage('recorder');
    if (pic) {
      const img = el('img', '', device);
      img.src = pic;
      img.alt = '';
      img.draggable = false;
      this.tapeImg = img;
    }
    el('i', 'tape-led', device);
    const side = el('div', 'tape-side', deck);
    el('div', 'tape-kind', side, '▶ 재생 중');
    this.tapeTitle = el('div', 'tape-title', side);
    this.tapeClock = el('div', 'tape-clock', side);
    this.wave = el('div', 'tape-wave', side);
    for (let i = 0; i < BARS; i++) this.bars.push(el('i', '', this.wave));

    this.board = el('div', 'board', stage);
    this.board.hidden = true;
    this.boardTitle = el('div', 'board-title', this.board);
    this.boardRows = el('div', 'board-rows', this.board);

    this.plan = el('div', 'plan', stage);
    this.plan.hidden = true;

    this.panel = el('div', 'panel', stage);
    this.panel.hidden = true;

    this.figure = el('div', 'figure', stage);
    this.figure.hidden = true;

    this.black = el('div', 'blackout', stage);
    this.black.hidden = true;
  }

  /** Fades everything under the text box to black, or back. Resolves when the fade is done. */
  async fade(black: boolean): Promise<void> {
    this.stage.classList.toggle('blackened', black);
    if (black) {
      this.black.hidden = false;
      this.black.classList.remove('clear');
      replay(this.black, 'dark');
      await sleep(this.fast ? 0 : 550);
    } else {
      if (this.black.hidden) return;
      this.black.classList.remove('dark');
      replay(this.black, 'clear');
      await sleep(this.fast ? 0 : 550);
      this.black.hidden = true;
    }
  }

  /** A briefing board. Rows already on the board stay put; new ones slide in. */
  setBoard(title: string, rows: BoardRow[] | null): void {
    if (!rows) {
      this.board.hidden = true;
      this.shownRows.clear();
      this.boardRows.replaceChildren();
      return;
    }
    if (this.board.hidden || this.boardTitle.textContent !== title) {
      this.shownRows.clear();
      this.boardRows.replaceChildren();
      replay(this.board, 'in');
    }
    this.board.hidden = false;
    this.boardTitle.textContent = title;
    this.boardRows.replaceChildren();
    let added = false;
    for (const r of rows) {
      const k = `${r.time}|${r.text}`;
      const node = el('div', `board-row ${r.tag ?? ''}`, this.boardRows);
      el('span', 'board-time', node, r.time);
      const text = el('span', 'board-text', node);
      if (r.badge) el('em', 'board-badge', text, r.badge);
      text.append(r.text);
      if (!this.shownRows.has(k)) {
        node.classList.add('new');
        this.shownRows.add(k);
        added = true;
      }
    }
    if (added) sfx('paper');
  }

  /** The floor plan, not clickable, with some regions ringed and movements drawn on it. */
  setPlan(mapId: string | null, marks: string[] = [], routes: PlanRoute[] = []): void {
    if (!mapId) {
      this.plan.hidden = true;
      this.plan.replaceChildren();
      return;
    }
    const map = MAPS[mapId];
    const wasHidden = this.plan.hidden;
    this.plan.replaceChildren();
    el('div', 'plan-title', this.plan, map.title);
    const box = el('div', 'plan-box', this.plan);
    box.style.aspectRatio = `${map.width} / ${map.height}`;
    box.innerHTML = `<svg viewBox="0 0 ${map.width} ${map.height}" aria-hidden="true">${map.svg}${routesSvg(routes)}</svg>`;
    for (const id of marks) {
      const r = map.regions.find((x) => x.id === id);
      if (!r) continue;
      const m = el('div', 'plan-mark', box);
      // Near the top edge the label would sit on the map's own street names: put it under the ring.
      if (r.y < 100) m.classList.add('below');
      m.style.left = `${(r.x / map.width) * 100}%`;
      m.style.top = `${(r.y / map.height) * 100}%`;
      m.style.width = `${(r.w / map.width) * 100}%`;
      m.style.height = `${(r.h / map.height) * 100}%`;
      el('span', '', m, r.label);
    }
    this.plan.hidden = false;
    if (wasHidden) {
      replay(this.plan, 'in');
      sfx('paper');
    }
  }

  /**
   * The courtroom's wall screen: a row of cards. Calling it again with the same title keeps the
   * cards already up and slides in only the new ones, so a speech can build the screen card by card.
   */
  setPanel(title: string, cards: PanelCard[] | null): void {
    if (!cards) {
      this.panel.hidden = true;
      this.panel.replaceChildren();
      return;
    }
    const same = !this.panel.hidden && this.panel.dataset.title === title;
    const before = same ? Number(this.panel.dataset.count ?? 0) : 0;
    this.panel.replaceChildren();
    this.panel.dataset.title = title;
    this.panel.dataset.count = String(cards.length);
    const head = el('div', 'panel-head', this.panel);
    el('span', 'panel-kind', head, '법정 화면');
    el('span', 'panel-title', head, title);
    const row = el('div', 'panel-cards', this.panel);
    row.style.setProperty('--n', String(cards.length));
    cards.forEach((c, i) => {
      const card = el('div', `panel-card ${c.tone ?? ''}`, row);
      if (i >= before) card.classList.add('new');
      if (c.img) {
        const pic = el('div', 'panel-pic', card);
        if (c.img.startsWith('figure:')) pic.innerHTML = figureSvg(c.img.slice(7));
        else if (c.img.startsWith('icon:')) pic.innerHTML = PANEL_ICONS[c.img.slice(5)] ?? '';
        else this.paintCard?.(pic, c.img);
      }
      const words = el('div', 'panel-words', card);
      if (c.tag) el('em', 'panel-tag', words, c.tag);
      el('div', 'panel-name', words, c.name);
      if (c.role) el('div', 'panel-role', words, c.role);
      if (c.text) el('div', 'panel-text', words, c.text);
    });
    if (this.panel.hidden) replay(this.panel, 'in');
    this.panel.hidden = false;
    if (cards.length > before) sfx('paper');
  }

  /** A drawn diagram (engine/figures.ts) beside the speaker, with the given spots labelled. */
  setFigure(id: string | null, marks?: FigureMark[]): void {
    if (!id || !FIGURES[id]) {
      this.figure.hidden = true;
      this.figure.replaceChildren();
      return;
    }
    const f = FIGURES[id];
    const wasHidden = this.figure.hidden;
    this.figure.replaceChildren();
    el('div', 'figure-title', this.figure, f.title);
    paintFigure(el('div', 'figure-box', this.figure), id, marks);
    if (f.caption && !marks) el('div', 'figure-caption', this.figure, f.caption);
    this.figure.hidden = false;
    if (wasHidden) {
      replay(this.figure, 'in');
      sfx('paper');
    }
  }

  private sync(): void {
    const on = !this.cg.hidden || !this.cctv.hidden || !this.tape.hidden;
    this.stage.classList.toggle('cinema', on);
  }

  showCg(id: string | null): void {
    const url = id ? cgImage(id) : undefined;
    if (!id) {
      this.cg.classList.add('out');
      setTimeout(() => {
        if (this.cg.classList.contains('out')) this.cg.hidden = true;
      }, 600);
    } else {
      this.cg.hidden = false;
      this.cg.classList.remove('out');
      this.cg.style.backgroundImage = url ? `url("${url}")` : '';
      this.cg.dataset.label = url ? '' : id;
      replay(this.cg, 'in');
    }
    // Hide the HUD only while a picture is actually up.
    if (!id) setTimeout(() => this.sync(), 620);
    else this.sync();
  }

  /** `time` is "YYYY.MM.DD HH:MM:SS"; the clock runs on its own from there. */
  setCctv(cam: string | null, time = '', status = ''): void {
    clearInterval(this.timer);
    if (!cam) {
      this.cctv.hidden = true;
      this.boxes.replaceChildren();
      this.sync();
      return;
    }
    const [date, clock = '00:00:00'] = time.split(' ');
    const [h, m, s] = clock.split(':').map(Number);
    this.date = date;
    this.secs = h * 3600 + m * 60 + s;
    this.cam.textContent = cam;
    this.status.textContent = status;
    this.status.hidden = !status;
    this.paintClock();
    this.timer = window.setInterval(() => {
      this.secs++;
      this.paintClock();
    }, 1000);
    if (this.cctv.hidden) replay(this.cctv, 'cut');
    this.cctv.hidden = false;
    this.sync();
  }

  setStatus(text: string): void {
    this.status.textContent = text;
    this.status.hidden = !text;
  }

  private paintClock(): void {
    const s = this.secs;
    const pad = (n: number) => String(n).padStart(2, '0');
    this.clock.textContent = `${this.date} ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }

  setBoxes(list: DetectBox[]): void {
    this.boxes.replaceChildren();
    let alert = false;
    for (const b of list) {
      const node = el('div', b.alert ? 'det alert' : 'det', this.boxes);
      node.style.left = `${b.x}px`;
      node.style.top = `${b.y}px`;
      node.style.width = `${b.w}px`;
      node.style.height = `${b.h}px`;
      el('span', 'det-label', node, b.label);
      alert ||= !!b.alert;
    }
    if (list.length) sfx(alert ? 'detect' : 'select');
  }

  /** `art` swaps the device picture, so two different recordings never look like the same machine. */
  setTape(title: string | null, art = 'recorder'): void {
    if (!title) {
      this.tape.hidden = true;
      this.talking(false);
      this.sync();
      return;
    }
    const pic = itemImage(art);
    if (this.tapeImg && pic) this.tapeImg.src = pic;
    this.tape.dataset.art = art;
    this.tapeTitle.textContent = title;
    this.tapeClock.textContent = '--:--:--';
    this.tape.hidden = false;
    replay(this.tape, 'in');
    sfx('tape');
    this.sync();
  }

  get tapeOn(): boolean {
    return !this.tape.hidden;
  }

  tapeAt(at: string): void {
    this.tapeClock.textContent = at;
  }

  /** The waveform jumps while someone on the tape is speaking and settles to a hiss otherwise. */
  talking(on: boolean): void {
    clearInterval(this.waveTimer);
    const paint = (amp: number) => {
      this.bars.forEach((b, i) => {
        const edge = Math.sin((i / (BARS - 1)) * Math.PI);
        b.style.height = `${Math.max(3, (0.15 + Math.random() * amp) * 100 * edge)}%`;
      });
    };
    if (!on) {
      paint(0.08);
      return;
    }
    paint(0.85);
    this.waveTimer = window.setInterval(() => paint(0.85), 90);
  }

  /** Everything off at once, e.g. when a scene ends. */
  clear(): void {
    this.setCctv(null);
    this.setTape(null);
    this.setBoard('', null);
    this.setPlan(null);
    this.setPanel('', null);
    this.setFigure(null);
    this.black.hidden = true;
    this.cg.hidden = true;
    this.sync();
  }
}

// Small emblems for the wall screen's role cards: the store's camera AI and the court's 판관.
const PANEL_ICONS: Record<string, string> = {
  iguard: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="18" y="20" width="64" height="12" rx="4" class="pi-dark"/>
    <path d="M24 32 h52 v10 a26 26 0 0 1 -52 0 Z" class="pi-dark"/>
    <circle cx="50" cy="48" r="14" class="pi-lens"/>
    <circle cx="50" cy="48" r="6" class="pi-red"/>
    <path d="M14 82 h72" class="pi-line"/>
    <rect x="30" y="74" width="40" height="16" rx="3" class="pi-red"/>
  </svg>`,
  pangwan: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="40" class="pi-ring"/>
    <path d="M50 22 V78 M30 78 H70 M24 36 H76" class="pi-line"/>
    <path d="M24 36 L14 58 H34 Z M76 36 L66 58 H86 Z" class="pi-pan"/>
    <circle cx="50" cy="22" r="5" class="pi-lens"/>
  </svg>`,
};

/** A map's routes as SVG: solid for what a record shows, dashes for gaps and claims, each with its label. */
function routesSvg(routes: PlanRoute[]): string {
  if (!routes.length) return '';
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const defs = `<defs>
    <marker id="rt-fact" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#6ff2e8"/></marker>
    <marker id="rt-unseen" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#c9cfe6"/></marker>
    <marker id="rt-claim" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#ff6a5c"/></marker>
  </defs>`;
  const body = routes.map((r) => {
    const d = r.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    const [px, py] = r.points[r.points.length - 1];
    const [lx, ly] = r.at ?? [px + 10, py];
    const label = r.label
      ? `<g class="mp-route-label ${r.kind}"><rect x="${lx}" y="${ly - 14}" width="${r.label.length * 15 + 16}" height="26" rx="4"/><text x="${lx + 8}" y="${ly + 5}">${esc(r.label)}</text></g>`
      : '';
    return `<path class="mp-route ${r.kind}" d="${d}" marker-end="url(#rt-${r.kind})"/>${label}`;
  });
  return defs + body.join('');
}
