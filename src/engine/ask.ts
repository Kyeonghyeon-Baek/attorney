import { sfx } from './audio';
import { el, replay } from './dom';
import { push, type Action } from './input';
import { touchLayout } from './viewport';

const NUM: Partial<Record<Action, number>> = { n1: 0, n2: 1, n3: 2, n4: 3 };

/**
 * "질문 재구성" (4화) and plain choices (1화). An answer opens with nothing chosen: arrows, number
 * keys or a click choose an option, and only Enter, the confirm button or a second click on the
 * same option submits it. A `quick` menu (where to go next, nothing to get wrong) starts on the
 * first option and takes a single click or number key.
 */
export class AskPanel {
  private root: HTMLElement;
  private title: HTMLElement;
  private note: HTMLElement;
  private list: HTMLElement;
  private bar: HTMLElement;
  private readout: HTMLElement;
  private confirm: HTMLButtonElement;
  private hintBtn: HTMLButtonElement;
  /** Opens the hint window for the current question, when it has hints. */
  onHint: (() => void) | null = null;
  /** Opens the court record over the question (R or the HUD button); the question waits underneath. */
  onRecord: (() => Promise<unknown>) | null = null;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'ask', parent);
    this.root.hidden = true;
    this.title = el('div', 'ask-title', this.root);
    this.note = el('div', 'ask-note', this.root);
    this.list = el('div', 'ask-list', this.root);
    this.bar = el('div', 'ask-bar', this.root);
    this.readout = el('span', 'ask-readout', this.bar);
    this.hintBtn = el('button', 'btn btn-small ask-hint', this.bar, '힌트  H');
    this.confirm = el('button', 'btn btn-primary ask-confirm', this.bar, '이걸로 정한다  Enter');
    this.hintBtn.addEventListener('click', () => this.onHint?.());
  }

  open(note: string, labels: string[], used: Set<number>, title = '질문 재구성', quick = false): Promise<number> {
    this.title.textContent = title;
    this.note.textContent = note;
    this.root.hidden = false;
    this.root.classList.toggle('quick', quick);
    this.hintBtn.hidden = !this.onHint;
    this.confirm.hidden = quick;
    let sel = quick ? 0 : -1;
    const buttons = labels.map((label, i) => {
      const b = el('button', 'ask-option', this.list);
      el('span', 'ask-key', b, String(i + 1));
      el('span', '', b, label);
      b.classList.toggle('used', used.has(i));
      return b;
    });
    const paint = () => {
      buttons.forEach((b, i) => b.classList.toggle('on', i === sel));
      this.confirm.disabled = sel < 0;
      const touch = touchLayout();
      this.readout.textContent = quick
        ? (touch ? '누르면 바로 정해져요' : '클릭하거나 숫자를 누르면 바로 정해져요')
        : sel >= 0 ? '고른 답: ' + (sel + 1) + '번'
          : touch ? '답을 고르고 「이걸로 정한다」를 눌러요' : '↑ ↓ 또는 숫자로 고른 뒤 Enter';
      this.readout.classList.remove('nudge');
    };
    paint();
    sfx('open');
    return new Promise((resolve) => {
      const choose = () => {
        if (sel < 0) {
          // Enter with nothing chosen does not answer; it only points at how to choose.
          replay(this.readout, 'nudge');
          return;
        }
        pop();
        sfx('select');
        this.root.hidden = true;
        this.list.replaceChildren();
        resolve(sel);
      };
      const pick = (i: number) => {
        sel = i;
        sfx('select');
        paint();
      };
      buttons.forEach((b, i) =>
        b.addEventListener('click', () => {
          if (sel === i || quick) {
            sel = i;
            choose();
          } else pick(i);
        }),
      );
      this.confirm.onclick = () => choose();
      const pop = push((a) => {
        const n = NUM[a];
        if (n !== undefined && n < labels.length) {
          pick(n);
          if (quick) choose();
        }
        else if (a === 'up') pick(sel <= 0 ? 0 : sel - 1);
        else if (a === 'down') pick(sel < 0 ? 0 : Math.min(labels.length - 1, sel + 1));
        else if (a === 'advance') choose();
        else if (a === 'record' && this.onRecord) void this.onRecord();
      }, { strict: true });
    });
  }
}
