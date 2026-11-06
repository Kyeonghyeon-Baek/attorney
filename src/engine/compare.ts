import { sfx } from './audio';
import { el, replay, setLabel } from './dom';
import { push } from './input';
import { plateSvg } from './plates';
import { touchLayout } from './viewport';

/** A spot to find on the compared photos, in plate pixels (1280×720). */
export interface CompareSpot {
  id: string;
  label: string;
  rect: [number, number, number, number];
  /** Said when the player marks it. */
  found: string;
}

/**
 * Two photos laid over each other (2화 「겹쳐 보기」): a slider fades the top one in and out, and
 * the player marks where they differ. Optionally a second stage swaps the top photo and offers a
 * left–right flip, which makes it line up exactly. Wrong marks only get a line of feedback.
 */
export interface CompareTask {
  title: string;
  prompt: string;
  /** Plate ids (engine/plates.ts). */
  base: string;
  top: string;
  baseLabel: string;
  topLabel: string;
  spots: CompareSpot[];
  /** How many of the spots must be found (default: all). */
  need?: number;
  /** Said for a click on nothing in particular. */
  miss: string;
  /** Said once every needed spot is marked. */
  done: string;
  /** Second stage: the top photo is replaced, and flipping it makes the two match. */
  flip?: { top: string; topLabel: string; prompt: string; done: string };
}

const STEP = 40;

/**
 * Mouse: click to mark, slider for the overlay, 「확대」 for a 2× look (it follows the pointer).
 * Keyboard: arrows move a crosshair, Enter marks there, 1~9 set the overlay from 10% to 90%,
 * Q zooms in on the crosshair.
 */
export class CompareView {
  open(stage: HTMLElement, t: CompareTask, openRecord?: () => Promise<unknown>, onHint?: () => void): Promise<void> {
    const root = el('div', 'compareview', stage);
    const panel = el('div', 'compareview-panel', root);
    const head = el('div', 'compareview-head', panel);
    el('h2', 'compareview-title', head, t.title);
    const count = el('span', 'compare-count', head);
    const prompt = el('p', 'compareview-prompt', panel, t.prompt);
    const view = el('div', 'compare-view', panel);
    // Everything that zooms together: both photos, the marks and the crosshair.
    const inner = el('div', 'compare-inner', view);
    const base = el('div', 'compare-layer base', inner);
    base.innerHTML = plateSvg(t.base);
    const top = el('div', 'compare-layer top', inner);
    top.innerHTML = plateSvg(t.top);
    const marks = el('div', 'compare-marks', inner);
    const cross = el('div', 'compare-cross', inner);
    const ctrl = el('div', 'compare-ctrl', panel);
    el('span', 'compare-name', ctrl, t.baseLabel);
    const slider = el('input', 'compare-slider', ctrl) as HTMLInputElement;
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '50';
    slider.setAttribute('aria-label', '겹친 사진의 진하기');
    const topName = el('span', 'compare-name', ctrl, t.topLabel);
    const zoomBtn = el('button', 'btn', ctrl, touchLayout() ? '확대' : '확대  Q');
    const flipBtn = el('button', 'btn', ctrl, '좌우 뒤집기');
    flipBtn.hidden = true;
    const say = el('p', 'compareview-say', panel);
    say.setAttribute('aria-live', 'polite');
    const foot = el('footer', 'compareview-foot', panel);
    el('span', 'compareview-hint', foot, touchLayout()
      ? '다른 곳을 눌러 표시 · 막대로 진하기'
      : '클릭 또는 방향키+Enter로 표시 · 1~9 진하기 · Q 확대');
    const hintBtn = onHint ? el('button', 'btn', foot, '힌트  H') : null;
    hintBtn?.addEventListener('click', onHint!);
    const go = el('button', 'btn btn-primary', foot, '계속  Enter');
    go.disabled = true;

    const need = t.need ?? t.spots.length;
    const found = new Set<string>();
    let stageNo: 1 | 2 | 3 = 1;
    let flipped = false;
    let zoomed = false;
    const cur = { x: 640, y: 360 };
    const paintCount = () => {
      count.textContent = stageNo === 1 ? `찾은 곳 ${found.size} / ${need}` : '찾은 곳 모두 표시함';
    };
    const paintCross = () => {
      cross.style.left = `${(cur.x / 1280) * 100}%`;
      cross.style.top = `${(cur.y / 720) * 100}%`;
      if (zoomed) inner.style.transformOrigin = `${(cur.x / 1280) * 100}% ${(cur.y / 720) * 100}%`;
    };
    const fade = () => { top.style.opacity = String(Number(slider.value) / 100); };
    paintCount();
    paintCross();
    fade();
    slider.addEventListener('input', fade);
    const tell = (text: string, good = false) => {
      say.textContent = text;
      say.classList.toggle('good', good);
      replay(say, 'on');
    };
    const setZoom = (on: boolean) => {
      zoomed = on;
      inner.classList.toggle('zoomed', on);
      setLabel(zoomBtn, on ? (touchLayout() ? '원래대로' : '원래대로  Q') : (touchLayout() ? '확대' : '확대  Q'));
      paintCross();
    };
    zoomBtn.addEventListener('click', () => setZoom(!zoomed));
    // While zoomed, the close-up follows the pointer.
    view.addEventListener('mousemove', (e) => {
      if (!zoomed) return;
      const r = view.getBoundingClientRect();
      inner.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });

    const toStage2 = () => {
      if (!t.flip) {
        stageNo = 3;
        go.disabled = false;
        paintCount();
        return;
      }
      stageNo = 2;
      top.innerHTML = plateSvg(t.flip.top);
      topName.textContent = t.flip.topLabel;
      prompt.textContent = t.flip.prompt;
      marks.replaceChildren();
      flipBtn.hidden = false;
      setZoom(false);
      slider.value = '50';
      fade();
      paintCount();
      sfx('paper');
    };

    /** Marks the spot under (x, y) in plate pixels, if any. */
    const mark = (x: number, y: number) => {
      if (stageNo !== 1) return;
      const hit = t.spots.find((s) => x >= s.rect[0] && x <= s.rect[0] + s.rect[2] && y >= s.rect[1] && y <= s.rect[1] + s.rect[3]);
      if (!hit) {
        sfx('close');
        tell(t.miss);
        return;
      }
      if (found.has(hit.id)) {
        tell(hit.found);
        return;
      }
      found.add(hit.id);
      sfx('realize');
      const m = el('div', 'compare-mark', marks, String(found.size));
      m.style.left = `${(hit.rect[0] / 1280) * 100}%`;
      m.style.top = `${(hit.rect[1] / 720) * 100}%`;
      m.style.width = `${(hit.rect[2] / 1280) * 100}%`;
      m.style.height = `${(hit.rect[3] / 720) * 100}%`;
      el('span', '', m, hit.label);
      paintCount();
      tell(hit.found, true);
      if (found.size >= need) {
        tell(`${hit.found}  ${t.done}`, true);
        setTimeout(toStage2, 900);
      }
    };

    // The inner layer's box already includes the zoom, so a click maps straight to plate pixels.
    view.addEventListener('click', (e) => {
      const r = inner.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 1280;
      const y = ((e.clientY - r.top) / r.height) * 720;
      cur.x = x;
      cur.y = y;
      paintCross();
      mark(x, y);
    });

    const doFlip = () => {
      if (stageNo !== 2) return;
      flipped = !flipped;
      top.classList.toggle('flipped', flipped);
      sfx('whoosh');
      if (flipped) {
        slider.value = '50';
        fade();
        tell(t.flip!.done, true);
        stageNo = 3;
        go.disabled = false;
        flipBtn.hidden = true;
        setLabel(go, '계속  Enter');
      }
    };
    flipBtn.addEventListener('click', doFlip);

    sfx('paper');
    return new Promise((resolve) => {
      const finish = () => {
        pop();
        root.remove();
        sfx('close');
        resolve();
      };
      go.addEventListener('click', () => { if (stageNo === 3) finish(); });
      const pop = push((a) => {
        if (a === 'record' && openRecord) {
          void openRecord();
          return;
        }
        if (a === 'hint' && onHint) {
          onHint();
          return;
        }
        const n = /^n(\d)$/.exec(a);
        if (n) {
          slider.value = String(Number(n[1]) * 10);
          fade();
          return;
        }
        if (a === 'press') {
          setZoom(!zoomed);
          return;
        }
        if (a === 'left' || a === 'right' || a === 'up' || a === 'down') {
          const step = zoomed ? STEP / 2 : STEP;
          if (a === 'left') cur.x = Math.max(0, cur.x - step);
          if (a === 'right') cur.x = Math.min(1280, cur.x + step);
          if (a === 'up') cur.y = Math.max(0, cur.y - step);
          if (a === 'down') cur.y = Math.min(720, cur.y + step);
          paintCross();
          return;
        }
        if (a !== 'advance') return;
        if (stageNo === 1) mark(cur.x, cur.y);
        else if (stageNo === 2) doFlip();
        else finish();
      }, { strict: true });
    });
  }
}
