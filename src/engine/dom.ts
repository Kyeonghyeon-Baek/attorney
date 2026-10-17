export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, className = '', parent?: HTMLElement, text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  parent?.appendChild(node);
  return node;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Restarts a CSS animation class on an element. */
export function replay(node: HTMLElement, cls: string): void {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

/** Picks 을/를, 이/가 style particles by whether the last syllable has a final consonant. */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return withFinal;
  return code % 28 ? withFinal : withoutFinal;
}
