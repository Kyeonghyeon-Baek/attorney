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

const cgs = import.meta.glob('../assets/cg/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

const photos = import.meta.glob('../assets/photos/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

// Recorded music is fetched when a track first plays, not preloaded with the images.
const music = import.meta.glob('../assets/music/*.{m4a,mp3,ogg}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

export function musicFile(name: string): string | undefined {
  const prefix = `../assets/music/${name}.`;
  return Object.entries(music).find(([path]) => path.startsWith(prefix))?.[1];
}

/** The background plate of a still-photo set (see engine/photos.ts). */
export function photoImage(id: string): string | undefined {
  return photos[`../assets/photos/${id}.png`];
}

export function cgImage(id: string): string | undefined {
  return cgs[`../assets/cg/${id}.png`];
}

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
  return [
    ...Object.values(chars), ...Object.values(backgrounds), ...Object.values(items),
    ...Object.values(portraits), ...Object.values(cgs), ...Object.values(photos),
  ];
}
