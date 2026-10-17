// Art is discovered automatically: drop a PNG into src/assets and it appears in
// game. Anything missing falls back to a placeholder (see docs/art-guide.md).

const chars = import.meta.glob('../assets/chars/*/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

const backgrounds = import.meta.glob('../assets/bg/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

const items = import.meta.glob('../assets/items/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

const portraits = import.meta.glob('../assets/portraits/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

export function itemImage(id: string): string | undefined {
  return items[`../assets/items/${id}.png`];
}

export function portraitImage(id: string): string | undefined {
  return portraits[`../assets/portraits/${id}.png`];
}

export function charImage(id: string, emo: string): string | undefined {
  return chars[`../assets/chars/${id}/${emo}.png`] ?? chars[`../assets/chars/${id}/normal.png`];
}

export function bgImage(id: string): string | undefined {
  return backgrounds[`../assets/bg/${id}.png`];
}

export function allImageUrls(): string[] {
  return [...Object.values(chars), ...Object.values(backgrounds), ...Object.values(items), ...Object.values(portraits)];
}
