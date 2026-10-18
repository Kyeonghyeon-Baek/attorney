import { charImage, itemImage, portraitImage } from './assets';
import { el } from './dom';
import { icon } from './icons';
import { PHOTO_SETS } from './photos';
import type { Evidence, Profile } from './types';

// How many tile-widths wide the sprite is drawn when cropped to a face.
const ZOOM = 2.6;
// Sprites are 1024×1536.
const ASPECT = 1.5;

/**
 * Fills `box` with a person's photo: a dedicated portrait if one exists,
 * otherwise their sprite cropped around the face, otherwise their initial.
 */
export function paintFace(box: HTMLElement, p: Profile): void {
  box.replaceChildren();
  box.style.backgroundImage = '';
  box.classList.remove('photo', 'orb');
  box.style.setProperty('--face', p.color);
  const own = portraitImage(p.id);
  if (own) {
    box.classList.add('photo');
    box.style.backgroundImage = `url("${own}")`;
    box.style.backgroundSize = 'cover';
    box.style.backgroundPosition = 'center';
    return;
  }
  const sprite = p.sprite ? charImage(p.sprite, 'normal') : undefined;
  if (sprite) {
    const [fx, fy] = p.face ?? [0.5, 0.2];
    // Put the face centre in the middle of the box.
    const x = ((ZOOM * fx - 0.5) / (ZOOM - 1)) * 100;
    const y = ((ZOOM * ASPECT * fy - 0.5) / (ZOOM * ASPECT - 1)) * 100;
    box.classList.add('photo');
    box.style.backgroundImage = `url("${sprite}")`;
    box.style.backgroundSize = `${ZOOM * 100}% auto`;
    box.style.backgroundPosition = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
    return;
  }
  if (p.orb) {
    box.classList.add('orb');
    el('i', '', box);
    return;
  }
  box.textContent = p.name[0];
}

/** Fills `box` with an evidence picture, or its line icon until art exists. */
export function paintItem(box: HTMLElement, ev: Pick<Evidence, 'id' | 'icon' | 'art' | 'photos'>): void {
  const set = ev.photos ? PHOTO_SETS[ev.photos] : undefined;
  if (set && !itemImage(ev.art ?? ev.id)) {
    // A photo set is its own picture: the first frame, as a small print.
    const f = set.frames[0];
    box.classList.add('pic', 'print');
    box.innerHTML = `<svg viewBox="0 0 ${set.width} ${set.height}" aria-hidden="true">${f.svg}</svg>`;
    return;
  }
  const url = itemImage(ev.art ?? ev.id);
  box.classList.toggle('pic', !!url);
  if (url) {
    box.replaceChildren();
    const img = el('img', '', box);
    img.src = url;
    img.alt = '';
    img.draggable = false;
  } else {
    box.innerHTML = icon(ev.icon);
  }
}
