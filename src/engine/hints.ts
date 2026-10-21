import { sfx } from './audio';
import { el, setLabel } from './dom';
import { pushModal } from './input';

/**
 * Hints on request (1화): the window shows the stages read so far for the current question,
 * from the point at issue, to the kind of record, to the concrete pairing. The next stage only
 * appears on an explicit "다음 힌트" press. It sits above everything, like the line history.
 */
export class HintPanel {
  private root: HTMLElement | null = null;
  private more: (() => void) | null = null;

  get isOpen(): boolean {
    return !!this.root;
  }

  /** While open, H shows the next stage. */
  next(): void {
    this.more?.();
  }

  open(stage: HTMLElement, title: string, lines: string[], shown: number, onShow: (n: number) => void): Promise<void> {
    if (this.root) return Promise.resolve();
    const root = el('div', 'hintview', stage);
    this.root = root;
    const panel = el('div', 'hintview-panel', root);
    el('div', 'hintview-kicker', panel, '힌트');
    el('h2', 'hintview-title', panel, title);
    const list = el('ol', 'hintview-list', panel);
    const foot = el('footer', 'hintview-foot', panel);
    el('span', 'hintview-note', foot, '힌트를 봐도 판관 예측과 재검토 기회는 그대로예요.');
    const nextBtn = el('button', 'btn', foot, '다음 힌트 보기  H');
    const close = el('button', 'btn btn-primary', foot, '닫기  Esc');
    let n = Math.max(1, shown);
    const paint = () => {
      list.replaceChildren();
      const names = ['지금의 쟁점', '살펴볼 자료', '구체적으로'];
      lines.slice(0, n).forEach((line, i) => {
        const li = el('li', i === n - 1 ? 'fresh' : '', list);
        el('span', 'hintview-step', li, `${i + 1}단계 · ${names[i] ?? ''}`);
        el('span', '', li, line);
      });
      nextBtn.disabled = n >= lines.length;
      setLabel(nextBtn, n >= lines.length ? '마지막 힌트예요' : '다음 힌트 보기  H');
    };
    paint();
    onShow(n);
    sfx('paper');
    this.more = () => {
      if (n >= lines.length) return;
      n++;
      onShow(n);
      sfx('select');
      paint();
    };
    nextBtn.addEventListener('click', () => this.more?.());
    return new Promise((resolve) => {
      const finish = () => {
        pop();
        root.remove();
        this.root = null;
        this.more = null;
        sfx('close');
        resolve();
      };
      const pop = pushModal((a) => {
        if (a === 'back' || a === 'advance') finish();
      }, { strict: true });
      close.addEventListener('click', finish);
      root.addEventListener('click', (e) => {
        if (e.target === root) finish();
      });
    });
  }
}
