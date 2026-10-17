import { sfx } from './audio';
import { el, replay } from './dom';
import { push, type Action } from './input';
import type { Hotspot } from './types';

export type InvestAction = 'examine' | 'move' | 'talk' | 'present' | 'record';

export interface ListItem {
  id: string;
  label: string;
  thumb?: string;
  done?: boolean;
}

const NUM: Partial<Record<Action, number>> = { n1: 0, n2: 1, n3: 2, n4: 3 };

const ACTIONS: { id: InvestAction; label: string }[] = [
  { id: 'examine', label: '조사하기' },
  { id: 'move', label: '이동하기' },
  { id: 'talk', label: '대화하기' },
  { id: 'present', label: '제시하기' },
];

/** Location header, the four-way action menu, the examine cursor, and pick lists. */
export class InvestigateUi {
  private chip: HTMLElement;
  private chipName: HTMLElement;
  private menuEl: HTMLElement;
  private examineEl: HTMLElement;
  private listEl: HTMLElement;

  constructor(private stage: HTMLElement) {
    this.chip = el('div', 'loc-chip', stage);
    el('div', 'loc-kind', this.chip, '조사');
    this.chipName = el('div', 'loc-name', this.chip);
    this.menuEl = el('div', 'inv-menu', stage);
    this.examineEl = el('div', 'examine', stage);
    this.listEl = el('div', 'inv-list', stage);
    this.hide();
  }

  setLocation(name: string | null): void {
    this.chip.hidden = !name;
    this.chipName.textContent = name ?? '';
  }

  hide(): void {
    this.chip.hidden = true;
    this.menuEl.hidden = true;
    this.examineEl.hidden = true;
    this.listEl.hidden = true;
  }

  menu(canTalk: boolean): Promise<InvestAction> {
    this.menuEl.replaceChildren();
    this.menuEl.hidden = false;
    const enabled = ACTIONS.map((a) => canTalk || (a.id !== 'talk' && a.id !== 'present'));
    const buttons = ACTIONS.map((a, i) => {
      const b = el('button', 'inv-action', this.menuEl);
      el('span', 'inv-key', b, String(i + 1));
      el('span', '', b, a.label);
      b.disabled = !enabled[i];
      return b;
    });
    let sel = 0;
    const paint = () => buttons.forEach((b, i) => b.classList.toggle('on', i === sel));
    paint();
    return new Promise((resolve) => {
      const done = (a: InvestAction) => {
        pop();
        this.menuEl.hidden = true;
        sfx('select');
        resolve(a);
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => done(ACTIONS[i].id)));
      const step = (d: number) => {
        let next = sel;
        do next = (next + d + ACTIONS.length) % ACTIONS.length;
        while (!enabled[next]);
        sel = next;
        sfx('select');
        paint();
      };
      const pop = push((a) => {
        const n = NUM[a];
        if (n !== undefined && enabled[n]) done(ACTIONS[n].id);
        else if (a === 'right' || a === 'down') step(a === 'down' ? 2 : 1);
        else if (a === 'left' || a === 'up') step(a === 'up' ? -2 : -1);
        else if (a === 'advance') done(ACTIONS[sel].id);
        else if (a === 'record') done('record');
        else if (a === 'present' && enabled[3]) done('present');
      });
    });
  }

  /** Lets the player pick a spot on the background. Resolves null on 돌아가기. */
  examine(spots: Hotspot[], seen: (s: Hotspot) => boolean): Promise<Hotspot | null> {
    this.examineEl.replaceChildren();
    this.examineEl.hidden = false;
    this.stage.classList.add('examining');
    const area = el('div', 'spots', this.examineEl);
    const bar = el('div', 'examine-bar', this.examineEl);
    const hint = el('span', '', bar, '살펴볼 곳을 고르세요');
    const back = el('button', 'btn', bar, '돌아가기  Esc');
    const buttons = spots.map((s) => {
      const b = el('button', 'spot', area);
      Object.assign(b.style, { left: `${s.x}px`, top: `${s.y}px`, width: `${s.w}px`, height: `${s.h}px` });
      b.setAttribute('aria-label', s.label);
      el('span', 'spot-label', b, s.label);
      if (s.y < 44) b.classList.add('label-below');
      if (seen(s)) b.classList.add('seen');
      return b;
    });
    // Clicking empty space is a miss, like poking at a wall.
    const miss = el('div', 'spot-miss', area);
    area.prepend(miss);
    let focus = -1;
    sfx('open');
    return new Promise((resolve) => {
      const done = (s: Hotspot | null) => {
        pop();
        this.examineEl.hidden = true;
        this.stage.classList.remove('examining');
        if (s) sfx('select');
        else sfx('close');
        resolve(s);
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => done(spots[i])));
      back.addEventListener('click', () => done(null));
      miss.addEventListener('click', () => {
        sfx('select');
        hint.textContent = '여긴 특별한 게 없어 보여요';
        replay(bar, 'nudge');
      });
      const move = (d: number) => {
        if (!buttons.length) return;
        focus = (focus + d + buttons.length) % buttons.length;
        buttons[focus].focus();
        sfx('select');
      };
      const pop = push((a) => {
        if (a === 'back') done(null);
        else if (a === 'right' || a === 'down' || a === 'tab') move(1);
        else if (a === 'left' || a === 'up') move(-1);
        else if (a === 'advance' && focus >= 0) done(spots[focus]);
      });
    });
  }

  /** A titled list (destinations, topics). Resolves the picked id, or null on 돌아가기. */
  list(title: string, items: ListItem[]): Promise<string | null> {
    this.listEl.replaceChildren();
    this.listEl.hidden = false;
    el('div', 'inv-list-title', this.listEl, title);
    const wrap = el('div', 'inv-list-items', this.listEl);
    const buttons = items.map((it, i) => {
      const b = el('button', 'inv-item', wrap);
      if (it.thumb) {
        const th = el('span', 'inv-thumb', b);
        th.style.backgroundImage = `url("${it.thumb}")`;
      } else {
        el('span', 'inv-key', b, String(i + 1));
      }
      el('span', 'inv-item-label', b, it.label);
      if (it.done) {
        b.classList.add('done');
        el('span', 'inv-check', b, '✓');
      }
      return b;
    });
    const back = el('button', 'btn inv-back', this.listEl, '돌아가기  Esc');
    let sel = 0;
    const paint = () => buttons.forEach((b, i) => b.classList.toggle('on', i === sel));
    paint();
    sfx('open');
    return new Promise((resolve) => {
      const done = (id: string | null) => {
        pop();
        this.listEl.hidden = true;
        sfx(id ? 'select' : 'close');
        resolve(id);
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => done(items[i].id)));
      back.addEventListener('click', () => done(null));
      const pop = push((a) => {
        const n = NUM[a];
        if (n !== undefined && n < items.length) done(items[n].id);
        else if (a === 'up' || a === 'left') { sel = Math.max(0, sel - 1); sfx('select'); paint(); }
        else if (a === 'down' || a === 'right') { sel = Math.min(items.length - 1, sel + 1); sfx('select'); paint(); }
        else if (a === 'advance' && items.length) done(items[sel].id);
        else if (a === 'back') done(null);
      });
    });
  }
}
