import { blip } from './audio';
import { el, sleep } from './dom';
import { push } from './input';
import { CHAR_MS, settings } from './settings';
import type { Voice } from './types';

export type LineStyle = 'normal' | 'think' | 'testimony' | 'human' | 'notice' | 'tape';

interface Glyph {
  ch: string;
  cls: string;
  pause: number;
}

export interface LineOptions {
  name: string | null;
  who?: string;
  text: string;
  style: LineStyle;
  voice: Voice | null;
  onBlip?: () => void;
  instant?: boolean;
}

// Markup: {r}강조{/} for red emphasis, {p} for a beat of silence.
function parse(text: string): Glyph[] {
  const out: Glyph[] = [];
  let cls = '';
  for (let i = 0; i < text.length; ) {
    const tag = /^\{(r|\/|p)\}/.exec(text.slice(i));
    if (tag) {
      if (tag[1] === 'r') cls = 'em';
      else if (tag[1] === '/') cls = '';
      else if (out.length) out[out.length - 1].pause += 450;
      i += tag[0].length;
      continue;
    }
    out.push({ ch: text[i], cls, pause: 0 });
    i++;
  }
  const stops = '.!?…';
  out.forEach((g, i) => {
    const next = out[i + 1]?.ch ?? '';
    if (stops.includes(g.ch) && !stops.includes(next) && next !== '"' && next !== '\'') g.pause += g.ch === '…' ? 260 : 200;
    else if (g.ch === ',') g.pause += 110;
  });
  return out;
}

export class TextBox {
  readonly root: HTMLElement;
  private plate: HTMLElement;
  private body: HTMLElement;
  private arrow: HTMLElement;

  constructor(parent: HTMLElement, private fast: boolean) {
    this.root = el('div', 'textbox', parent);
    this.plate = el('div', 'plate', this.root);
    this.body = el('div', 'line', this.root);
    this.arrow = el('div', 'next', this.root, '▼');
  }

  hide(): void {
    this.root.classList.add('off');
  }

  async say(o: LineOptions): Promise<void> {
    this.root.classList.remove('off');
    this.root.dataset.style = o.style;
    this.root.dataset.who = o.who ?? '';
    this.plate.textContent = o.name ?? '';
    this.plate.hidden = !o.name;
    this.body.replaceChildren();
    this.arrow.classList.remove('on');

    const speed = settings().text;
    let skip = !!o.instant || (speed === 'instant' && !this.fast);
    const pop = push((a) => {
      if (a === 'advance') skip = true;
    });
    let span: HTMLElement | null = null;
    let count = 0;
    const perChar = this.fast ? 1 : CHAR_MS[speed];
    // Pauses after punctuation shrink with the text speed.
    const pauseScale = this.fast ? 0 : perChar / CHAR_MS.normal;
    for (const g of parse(o.text)) {
      if (!span || span.className !== g.cls) span = el('span', g.cls, this.body);
      span.textContent += g.ch;
      if (skip) continue;
      if (o.voice && g.ch.trim() && count++ % 2 === 0) {
        blip(o.voice);
        o.onBlip?.();
      }
      await sleep(perChar + g.pause * pauseScale);
    }
    pop();
  }

  showArrow(on: boolean): void {
    this.arrow.classList.toggle('on', on);
  }
}
