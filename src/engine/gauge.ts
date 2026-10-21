import { sfx } from './audio';
import { el, replay, sleep } from './dom';

/** "AI 판결 예측": the trial's health bar. Reaching 100% means a guilty verdict. */
export class Gauge {
  private root: HTMLElement;
  private num: HTMLElement;
  private fill: HTMLElement;
  private status: HTMLElement;
  private reason: HTMLElement;
  private reasonTimer = 0;
  private _value: number;

  constructor(parent: HTMLElement, initial: number, private fast: boolean) {
    this._value = initial;
    this.root = el('div', 'gauge', parent);
    const head = el('div', 'gauge-head', this.root);
    // Named after the court's AI, so it is never mistaken for the store camera's confidence.
    el('span', 'gauge-label', head, '판관 · AI 판결 예측');
    const right = el('span', 'gauge-value', head);
    el('span', 'gauge-verdict', right, '유죄 ');
    this.num = el('span', 'gauge-num', right);
    const track = el('div', 'gauge-track', this.root);
    this.fill = el('div', 'gauge-fill', track);
    el('div', 'gauge-line', track);
    this.status = el('div', 'gauge-status', this.root);
    this.status.hidden = true;
    this.reason = el('div', 'gauge-reason', parent);
    this.reason.hidden = true;
    this.render(initial);
  }

  /** The small badge under the number: what the prediction currently rests on. */
  setStatus(text: string | null): void {
    this.status.hidden = !text;
    this.status.textContent = text ?? '';
  }

  get statusText(): string {
    return this.status.hidden ? '' : this.status.textContent ?? '';
  }

  /** Shows why the number moved, briefly, without covering the dialogue. */
  explain(text: string): void {
    clearTimeout(this.reasonTimer);
    this.reason.textContent = text;
    this.reason.hidden = false;
    replay(this.reason, 'on');
    this.reasonTimer = window.setTimeout(() => (this.reason.hidden = true), this.fast ? 1500 : 4500);
  }

  get value(): number {
    return this._value;
  }

  set(v: number): void {
    this._value = Math.max(0, Math.min(100, v));
    this.render(this._value);
  }

  /** Animates the change. Resolves true if the verdict reached 100%. */
  async add(delta: number): Promise<boolean> {
    const from = this._value;
    const to = Math.max(0, Math.min(100, from + delta));
    this._value = to;
    sfx(delta > 0 ? 'damage' : 'heal');
    replay(this.root, delta > 0 ? 'up' : 'down');
    const steps = this.fast ? 2 : 24;
    for (let i = 1; i <= steps; i++) {
      this.render(from + ((to - from) * i) / steps);
      await sleep(this.fast ? 5 : 28);
    }
    await sleep(this.fast ? 0 : 350);
    return to >= 100;
  }

  /** Draws the eye to the bar without changing it. */
  pulse(): void {
    sfx('heartbeat');
    replay(this.root, 'pulse');
  }

  private render(v: number): void {
    this.num.textContent = `${v.toFixed(1)}%`;
    this.fill.style.width = `${v}%`;
    this.root.classList.toggle('danger', v >= 85);
  }
}
