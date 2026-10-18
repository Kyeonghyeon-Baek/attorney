import { cgImage, itemImage } from './assets';
import { sfx } from './audio';
import { el, replay, sleep } from './dom';
import { MAPS } from './maps';
import type { BoardRow, DetectBox } from './types';

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

  /** The floor plan, not clickable, with some regions ringed. */
  setPlan(mapId: string | null, marks: string[] = []): void {
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
    box.innerHTML = `<svg viewBox="0 0 ${map.width} ${map.height}" aria-hidden="true">${map.svg}</svg>`;
    for (const id of marks) {
      const r = map.regions.find((x) => x.id === id);
      if (!r) continue;
      const m = el('div', 'plan-mark', box);
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
    this.black.hidden = true;
    this.cg.hidden = true;
    this.sync();
  }
}
