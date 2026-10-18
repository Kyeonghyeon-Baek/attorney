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
    this.flashEl.classList.remove('red');
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

  /** A witness's name and role slide in over the scene the first time they appear. */
  async nameplate(name: string, title: string, color: string): Promise<void> {
    const node = el('div', 'nameplate', this.layer);
    node.style.setProperty('--np', color);
    el('div', 'np-title', node, title);
    el('div', 'np-name', node, name);
    sfx('whoosh');
    await sleep(this.ms(1900));
    node.classList.add('out');
    await sleep(this.ms(300));
    node.remove();
  }

  /** A short line in the middle of the screen, e.g. "증언 끝" over black. */
  async caption(text: string): Promise<void> {
    const node = el('div', 'caption', this.layer);
    el('span', 'caption-rule', node);
    el('span', 'caption-text', node, text);
    el('span', 'caption-rule', node);
    sfx('gavel');
    await sleep(this.ms(1300));
    node.classList.add('out');
    await sleep(this.ms(300));
    node.remove();
  }

  /** The episode's title card: number, 색동 rule, then the title stamped in. */
  async episode(no: string, title: string): Promise<void> {
    const node = el('div', 'episode', this.layer);
    el('div', 'episode-series', node, '판 뒤집기');
    el('div', 'episode-no', node, no);
    el('div', 'saekdong episode-rule', node);
    const name = el('div', 'episode-title', node);
    sfx('reveal');
    await sleep(this.ms(900));
    for (const ch of title) {
      const span = el('span', ch === ' ' ? 'gap' : '', name, ch);
      if (ch.trim() && !'()'.includes(ch)) sfx('select');
      void span;
      await sleep(this.fast ? 0 : ch === ' ' ? 60 : 110);
    }
    sfx('gavel');
    this.shake();
    await sleep(this.ms(2600));
    node.classList.add('out');
    await sleep(this.ms(700));
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

  /** Stamps the verdict one syllable at a time. An acquittal rains 색동 paper. */
  async verdict(word: string, acquit = false): Promise<void> {
    const node = el('div', acquit ? 'verdict acquit' : 'verdict', this.layer);
    for (const ch of word) {
      el('span', '', node, ch);
      sfx('gavel');
      this.shake(true);
      await sleep(this.ms(520));
    }
    if (acquit) {
      sfx('cheer');
      this.confetti();
    }
    await sleep(this.ms(acquit ? 2200 : 900));
    node.remove();
  }

  private confetti(): void {
    const colors = ['#c8372d', '#e8a93b', '#2e5aac', '#2f8f5b', '#d9668a', '#f4f0e6'];
    const box = el('div', 'confetti', this.layer);
    for (let i = 0; i < 90; i++) {
      const p = el('i', '', box);
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = `${Math.random() * 0.8}s`;
      p.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
      p.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
      p.style.setProperty('--spin', `${Math.random() * 900 - 450}deg`);
    }
    setTimeout(() => box.remove(), this.fast ? 300 : 5000);
  }

  redFlash(): void {
    this.flashEl.classList.remove('on');
    replay(this.flashEl, 'red');
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
