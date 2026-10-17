import { sfx } from './audio';
import { el, replay, sleep } from './dom';
import { push } from './input';
import type { ShoutKind } from './types';

export interface CardButton {
  label: string;
  primary?: boolean;
  /** Text shown after the first press; a second press confirms. */
  confirm?: string;
}

const SHOUT_TEXT: Record<ShoutKind, string> = {
  objection: '이의 있음!',
  holdit: '잠깐!',
  takethat: '받아라!',
};

// Jagged speech-burst outline, shared by every shout.
const BURST = (() => {
  const pts: string[] = [];
  const spikes = 22;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 1 : 0.8 + ((i * 37) % 7) / 60;
    pts.push(`${(300 + Math.cos(a) * 290 * r).toFixed(1)},${(160 + Math.sin(a) * 150 * r).toFixed(1)}`);
  }
  return pts.join(' ');
})();

export class Effects {
  private layer: HTMLElement;
  private flashEl: HTMLElement;

  constructor(private stage: HTMLElement, private fast: boolean) {
    this.layer = el('div', 'fx-layer', stage);
    this.flashEl = el('div', 'flash', stage);
  }

  private ms(n: number): number {
    return this.fast ? Math.min(n, 120) : n;
  }

  async shout(kind: ShoutKind): Promise<void> {
    const node = el('div', `shout shout-${kind}`, this.layer);
    node.innerHTML = `
      <svg viewBox="0 0 600 320" aria-hidden="true"><polygon points="${BURST}"/></svg>
      <span>${SHOUT_TEXT[kind]}</span>`;
    sfx('shout');
    this.shake(true);
    await sleep(this.ms(950));
    node.remove();
  }

  shake(big = false): void {
    replay(this.stage, big ? 'bigshake' : 'shake');
  }

  flash(): void {
    replay(this.flashEl, 'on');
  }

  async banner(text: string, sub: string): Promise<void> {
    const node = el('div', 'banner', this.layer);
    el('div', 'banner-bar', node);
    el('div', 'banner-text', node, text);
    el('div', 'banner-sub', node, sub);
    sfx('whoosh');
    await sleep(this.ms(1700));
    node.classList.add('out');
    await sleep(this.ms(300));
    node.remove();
  }

  async place(lines: string[]): Promise<void> {
    const node = el('div', 'place', this.layer);
    for (const line of lines) {
      const row = el('div', '', node);
      for (const ch of line) {
        row.textContent += ch;
        if (ch.trim()) sfx('select');
        await sleep(this.fast ? 0 : 45);
      }
      await sleep(this.ms(160));
    }
    await sleep(this.ms(1300));
    node.classList.add('out');
    await sleep(this.ms(400));
    node.remove();
  }

  async verdict(word: string): Promise<void> {
    const node = el('div', 'verdict', this.layer);
    for (const ch of word) {
      el('span', '', node, ch);
      sfx('gavel');
      this.shake(true);
      await sleep(this.ms(520));
    }
    await sleep(this.ms(900));
    node.remove();
  }

  /**
   * Full-stage card with one or more buttons. Resolves the index of the button pressed.
   * A button with `confirm` asks for a second press, showing that text in between.
   */
  async card(build: (body: HTMLElement) => void, buttons: string | CardButton[], cls = ''): Promise<number> {
    const list: CardButton[] = typeof buttons === 'string' ? [{ label: buttons, primary: true }] : buttons;
    const node = el('div', `card-screen ${cls}`, this.stage);
    const body = el('div', 'card-body', node);
    build(body);
    const row = el('div', 'card-actions', body);
    const btns = list.map((b) => el('button', b.primary ? 'btn btn-primary' : 'btn', row, b.label));
    btns[0].focus();
    const chosen = await new Promise<number>((resolve) => {
      const armed = new Set<number>();
      const press = (i: number) => {
        const conf = list[i].confirm;
        if (conf && !armed.has(i)) {
          armed.add(i);
          btns[i].textContent = conf;
          btns[i].classList.add('btn-warn');
          sfx('select');
          return;
        }
        pop();
        resolve(i);
      };
      const focused = () => Math.max(0, btns.indexOf(document.activeElement as HTMLButtonElement));
      const pop = push((a) => {
        if (a === 'advance') press(focused());
        else if (a === 'right' || a === 'down') btns[(focused() + 1) % btns.length].focus();
        else if (a === 'left' || a === 'up') btns[(focused() - 1 + btns.length) % btns.length].focus();
      });
      btns.forEach((b, i) => b.addEventListener('click', () => press(i)));
    });
    node.remove();
    return chosen;
  }
}
