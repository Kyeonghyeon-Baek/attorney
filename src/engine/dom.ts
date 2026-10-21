export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, className = '', parent?: HTMLElement, text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) {
    if (tag === 'button') setLabel(node, text);
    else node.textContent = text;
  }
  parent?.appendChild(node);
  return node;
}

/**
 * Button labels end in their keyboard key after two spaces ('흔들기  Q'). The key goes in its own
 * span so touch screens, which have no keyboard, can hide it.
 */
export function setLabel(button: HTMLElement, text: string): void {
  const m = /^(.*\S)(  \S+)$/.exec(text);
  if (!m) {
    button.textContent = text;
    return;
  }
  button.textContent = m[1];
  el('span', 'key', button, m[2]);
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Restarts a CSS animation class on an element. */
export function replay(node: HTMLElement, cls: string): void {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

/**
 * Scrolls `box` so `target` sits at the top, centre or nearest edge, without touching any other
 * ancestor (scrollIntoView would also nudge the scaled stage). Works in unscaled CSS pixels.
 */
export function scrollWithin(box: HTMLElement, target: Element, align: 'start' | 'center' | 'nearest' = 'center'): void {
  const b = box.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const k = box.offsetHeight ? b.height / box.offsetHeight : 1;
  const top = (t.top - b.top) / k;
  const h = t.height / k;
  let d = 0;
  if (align === 'start') d = top;
  else if (align === 'center') d = top - (box.clientHeight - h) / 2;
  else if (top < 0) d = top;
  else if (top + h > box.clientHeight) d = top + h - box.clientHeight;
  box.scrollTop += d;
}

const flashTimers = new WeakMap<HTMLElement, number>();

/**
 * Shows a passing notice for `ms`, then takes it out of the page (not just transparent, so screen
 * readers and page text never keep a stale "saved" or "noted"). Calling again restarts the clock.
 */
export function flash(node: HTMLElement, cls: string, ms: number, done?: () => void): void {
  node.hidden = false;
  replay(node, cls);
  clearTimeout(flashTimers.get(node));
  flashTimers.set(node, window.setTimeout(() => {
    node.hidden = true;
    node.classList.remove(cls);
    done?.();
  }, ms));
}

/** Picks 을/를, 이/가 style particles by whether the last syllable has a final consonant. */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return withFinal;
  return code % 28 ? withFinal : withoutFinal;
}
