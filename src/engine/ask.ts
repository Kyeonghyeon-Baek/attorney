import { sfx } from './audio';
import { el } from './dom';
import { push, type Action } from './input';

const NUM: Partial<Record<Action, number>> = { n1: 0, n2: 1, n3: 2, n4: 3 };

/** "질문 재구성": the AI only answers what it is asked, so the player picks the wording. */
export class AskPanel {
  private root: HTMLElement;
  private note: HTMLElement;
  private list: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'ask', parent);
    this.root.hidden = true;
    el('div', 'ask-title', this.root, '질문 재구성');
    this.note = el('div', 'ask-note', this.root);
    this.list = el('div', 'ask-list', this.root);
  }

  open(note: string, labels: string[], used: Set<number>): Promise<number> {
    this.note.textContent = note;
    this.root.hidden = false;
    let sel = labels.findIndex((_, i) => !used.has(i));
    if (sel < 0) sel = 0;
    const buttons = labels.map((label, i) => {
      const b = el('button', 'ask-option', this.list);
      el('span', 'ask-key', b, String(i + 1));
      el('span', '', b, label);
      b.classList.toggle('used', used.has(i));
      return b;
    });
    const paint = () => buttons.forEach((b, i) => b.classList.toggle('on', i === sel));
    paint();
    sfx('open');
    return new Promise((resolve) => {
      const choose = (i: number) => {
        pop();
        sfx('select');
        this.root.hidden = true;
        this.list.replaceChildren();
        resolve(i);
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => choose(i)));
      const pop = push((a) => {
        const n = NUM[a];
        if (n !== undefined && n < labels.length) choose(n);
        else if (a === 'up' && sel > 0) { sel--; sfx('select'); paint(); }
        else if (a === 'down' && sel < labels.length - 1) { sel++; sfx('select'); paint(); }
        else if (a === 'advance') choose(sel);
      });
    });
  }
}
