import { sfx } from './audio';
import { el, setLabel } from './dom';
import { push } from './input';
import { PLATES, plateSvg } from './plates';
import { touchLayout } from './viewport';

/**
 * In-world photos one at a time over the whole stage, read-only: ← → (buttons or a swipe) step
 * through them in order, and Esc, Enter, Space or a tap on the picture goes back to what was open
 * underneath. Choices that ask about a picture use it to compare the frames themselves (2화 clip).
 */
export function openPlateGallery(parent: HTMLElement, plates: string[], start = 0): Promise<void> {
  const list = plates.filter((id) => PLATES[id]);
  if (!list.length) return Promise.resolve();
  let at = Math.max(0, Math.min(list.length - 1, start));
  const root = el('div', 'gallery', parent);
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  const head = el('div', 'gallery-head', root);
  const title = el('span', 'gallery-title', head);
  const count = el('span', 'gallery-count', head);
  const close = el('button', 'btn gallery-close', head, '돌아가기  Esc');
  const main = el('div', 'gallery-main', root);
  const prev = el('button', 'evview-arrow gallery-prev', main, '‹');
  prev.setAttribute('aria-label', '이전 그림');
  const pic = el('div', 'gallery-pic', main);
  const next = el('button', 'evview-arrow gallery-next', main, '›');
  next.setAttribute('aria-label', '다음 그림');
  const strip = el('div', 'gallery-strip', root);
  const thumbs = list.map((id, i) => {
    const b = el('button', 'gallery-thumb', strip);
    b.innerHTML = plateSvg(id, 'photoplate').replace('xMidYMid slice', 'xMidYMid meet');
    el('span', '', b, PLATES[id].title);
    b.addEventListener('click', () => go(i));
    return b;
  });
  const paint = () => {
    pic.innerHTML = plateSvg(list[at], 'photoplate').replace('xMidYMid slice', 'xMidYMid meet');
    title.textContent = PLATES[list[at]].title;
    count.textContent = list.length > 1 ? `${at + 1} / ${list.length}` : '';
    prev.disabled = at === 0;
    next.disabled = at === list.length - 1;
    prev.classList.toggle('gone', list.length < 2);
    next.classList.toggle('gone', list.length < 2);
    strip.hidden = list.length < 2;
    thumbs.forEach((b, i) => b.classList.toggle('on', i === at));
  };
  const go = (i: number) => {
    if (i < 0 || i >= list.length || i === at) return;
    at = i;
    sfx('select');
    paint();
  };
  setLabel(close, touchLayout() ? '돌아가기' : '돌아가기  Esc');
  paint();
  sfx('open');
  return new Promise((resolve) => {
    const done = () => {
      pop();
      root.remove();
      sfx('close');
      resolve();
    };
    const pop = push((a) => {
      if (a === 'left') go(at - 1);
      else if (a === 'right') go(at + 1);
      else if (a === 'back' || a === 'record' || a === 'advance') done();
      else if (/^n\d$/.test(a)) go(Number(a.slice(1)) - 1);
    }, { strict: true });
    close.addEventListener('click', done);
    pic.addEventListener('click', done);
    prev.addEventListener('click', () => go(at - 1));
    next.addEventListener('click', () => go(at + 1));
    let touch: { x: number; y: number } | null = null;
    main.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touch = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
    }, { passive: true });
    main.addEventListener('touchend', (e) => {
      if (!touch) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touch.x;
      touch = null;
      if (Math.abs(dx) > 60) go(at + (dx < 0 ? 1 : -1));
    }, { passive: true });
  });
}
