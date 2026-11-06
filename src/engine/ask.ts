import { sfx } from './audio';
import { el, replay, setLabel } from './dom';
import { openPlateGallery } from './gallery';
import { PLATES, plateSvg } from './plates';
import { fromSpace, push, type Action } from './input';
import { touchLayout } from './viewport';

const NUM: Partial<Record<Action, number>> = { n1: 0, n2: 1, n3: 2, n4: 3, n5: 4, n6: 5, n7: 6, n8: 7, n9: 8 };

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
  private zoomBtn: HTMLButtonElement;
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
    this.zoomBtn = el('button', 'btn btn-small ask-zoom', this.bar, '크게 보기  Space');
    this.confirm = el('button', 'btn btn-primary ask-confirm', this.bar, '이걸로 정한다  Enter');
    this.hintBtn.addEventListener('click', () => this.onHint?.());
  }

  /**
   * `pictures` (one plate id per option, optional) turns the options into picture cards; `gallery`
   * is what "크게 보기" pages through (defaults to the options' pictures), so the frames being asked
   * about can be compared right here rather than in the court record.
   */
  open(
    note: string, labels: string[], used: Set<number>, title = '질문 재구성', quick = false,
    pictures?: (string | undefined)[], gallery?: string[],
  ): Promise<number> {
    const pics = pictures?.some((p) => p && PLATES[p]) ? pictures : undefined;
    const frames = pics ? (gallery?.length ? gallery : pics.filter((p): p is string => !!p)) : [];
    this.root.classList.toggle('visual', !!pics);
    this.zoomBtn.hidden = !pics;
    setLabel(this.zoomBtn, touchLayout() ? '크게 보기' : '크게 보기  Space');
    this.title.textContent = title;
    this.note.textContent = note;
    this.root.hidden = false;
    this.root.classList.toggle('quick', quick);
    this.hintBtn.hidden = !this.onHint;
    this.confirm.hidden = quick;
    let sel = quick ? 0 : -1;
    const buttons = labels.map((label, i) => {
      const b = el('button', 'ask-option', this.list);
      const plate = pics?.[i];
      if (plate && PLATES[plate]) {
        el('span', 'ask-pic', b).innerHTML = plateSvg(plate, 'photoplate').replace('xMidYMid slice', 'xMidYMid meet');
      }
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
          : touch ? (pics ? '그림을 눌러 고르고 「이걸로 정한다」를 눌러요' : '답을 고르고 「이걸로 정한다」를 눌러요')
            : pics ? '← → 또는 숫자로 고르고 Space로 크게 보기 · 정하는 건 Enter' : '↑ ↓ 또는 숫자로 고른 뒤 Enter';
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
      // The pictures full stage, starting at the chosen option's; the question waits underneath.
      let zooming = false;
      const zoom = async () => {
        if (!frames.length || zooming) return;
        zooming = true;
        const cur = sel >= 0 ? pics?.[sel] : undefined;
        await openPlateGallery(this.root.parentElement ?? this.root, frames, Math.max(0, cur ? frames.indexOf(cur) : 0));
        zooming = false;
      };
      this.zoomBtn.onclick = () => void zoom();
      const pop = push((a) => {
        const n = NUM[a];
        if (n !== undefined && n < labels.length) {
          pick(n);
          if (quick) choose();
        }
        else if (a === 'up' || (pics && a === 'left')) pick(sel <= 0 ? 0 : sel - 1);
        else if (a === 'down' || (pics && a === 'right')) pick(sel < 0 ? 0 : Math.min(labels.length - 1, sel + 1));
        // With pictures, Space looks closer and only Enter answers.
        else if (a === 'advance' && pics && fromSpace()) void zoom();
        else if (a === 'advance') choose();
        else if (a === 'record' && this.onRecord) void this.onRecord();
      }, { strict: true });
    });
  }
}
