import { bgImage, charImage } from './assets';
import { el, replay } from './dom';
import { paintFace, paintItem } from './portrait';
import type { HeldItem } from './record';
import type { CharId, DaonMode, Position } from './types';
import { CHARACTERS } from '../content/characters';

const BG_FOR: Record<Position, string> = {
  defense: 'defense',
  prosecution: 'prosecution',
  witness: 'witness',
  judge: 'judge',
  counsel: 'defense',
  defendant: 'witness',
  field: '',
};

const DAON_STATUS: Record<DaonMode, string> = {
  normal: '응답 대기 중',
  glitch: '질문을 해석할 수 없음',
  human: '누군가 입력 중',
};

export class Stage {
  readonly root: HTMLElement;
  private bg: HTMLElement;
  private actor: HTMLElement;
  private daon: HTMLElement;
  private daonOrb: HTMLElement;
  private daonStatus: HTMLElement;
  private evCard: HTMLElement;
  private who: CharId | null = null;
  private emo = 'normal';
  private daonMode: DaonMode = 'normal';
  private fieldBg: string | null = null;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'scene', parent);
    this.bg = el('div', 'bg', this.root);
    this.actor = el('div', 'actor', this.root);
    el('div', 'desk', this.root);
    this.daon = el('div', 'daon', this.root);
    const screen = el('div', 'daon-screen', this.daon);
    const rings = el('div', 'daon-rings', screen);
    for (let i = 0; i < 3; i++) el('i', '', rings);
    this.daonOrb = el('div', 'daon-orb', screen);
    const dots = el('div', 'daon-dots', screen);
    for (let i = 0; i < 3; i++) el('i', '', dots);
    el('div', 'daon-scan', screen);
    this.daonStatus = el('div', 'daon-status', screen, DAON_STATUS.normal);
    el('div', 'daon-neck', this.daon);
    this.evCard = el('div', 'ev-card', this.root);
  }

  /**
   * Investigation mode: everyone appears in front of the location background,
   * and the player's side (강단비, 신나래) stays off screen as first-person voices.
   */
  setField(bg: string | null): void {
    this.fieldBg = bg;
    this.root.classList.toggle('field', !!bg);
    this.who = null;
  }

  /** Shows the current location with whoever is standing there, at ease. */
  showPlace(person?: CharId): void {
    if (person) {
      this.show(person, 'normal');
      return;
    }
    this.who = null;
    this.render(null, 'normal', 'field');
  }

  show(who: CharId, emo?: string): void {
    if (this.fieldBg && (who === 'dan' || who === 'narae')) return;
    const nextEmo = emo ?? (who === this.who ? this.emo : 'normal');
    if (who === this.who && nextEmo === this.emo) return;
    const cut = who !== this.who;
    this.who = who;
    this.emo = nextEmo;
    if (cut) this.actor.classList.remove('zoom');
    this.render(who, nextEmo, this.fieldBg ? 'field' : CHARACTERS[who].pos);
    if (cut) replay(this.root, 'cut');
    if (['shock', 'surprised', 'panic', 'sweat', 'cornered', 'rage'].includes(nextEmo)) replay(this.actor, 'jolt');
  }

  /** Cuts to black between chapters. */
  clear(): void {
    this.who = null;
    delete this.root.dataset.pos;
    this.bg.style.backgroundImage = 'none';
    this.bg.classList.add('has-img');
    this.actor.replaceChildren();
    this.daon.hidden = true;
  }

  private render(who: CharId | null, emo: string, pos: Position): void {
    this.root.dataset.pos = pos;
    this.root.dataset.who = who ?? '';
    const bgId = pos === 'field' ? this.fieldBg ?? '' : BG_FOR[pos];
    const bgUrl = bgImage(bgId);
    this.bg.style.backgroundImage = bgUrl ? `url("${bgUrl}")` : '';
    this.bg.classList.toggle('has-img', !!bgUrl);
    this.bg.dataset.label = bgUrl ? '' : bgId;

    const onMonitor = (pos === 'witness' || pos === 'field') && (who === 'daon' || who === 'operator');
    this.daon.hidden = !onMonitor;
    this.actor.replaceChildren();
    this.actor.dataset.emo = emo;
    if (!who || onMonitor) return;
    const ch = CHARACTERS[who];
    const url = charImage(who, emo);
    if (url) {
      const img = el('img', 'sprite', this.actor);
      img.src = url;
      img.alt = ch.name;
      img.draggable = false;
    } else {
      this.actor.appendChild(placeholder(ch.name, ch.color));
    }
  }

  /** Pushes the camera in on whoever is on screen, until the next cut. */
  zoom(): void {
    replay(this.actor, 'zoom');
  }

  setTalking(on: boolean): void {
    this.actor.classList.toggle('talking', on);
    this.daon.classList.toggle('talking', on);
    if (this.daonMode === 'normal') this.daonStatus.textContent = on ? '응답 생성 중' : DAON_STATUS.normal;
  }

  pulseDaon(): void {
    replay(this.daonOrb, 'pulse');
  }

  setDaonMode(mode: DaonMode): void {
    this.daonMode = mode;
    this.daon.dataset.mode = mode;
    this.daonStatus.textContent = DAON_STATUS[mode];
  }

  /** Holds up a piece of evidence or a person's profile next to the speaker. */
  showEvidence(item: HeldItem | null): void {
    if (!item) {
      this.evCard.classList.remove('on');
      return;
    }
    this.evCard.replaceChildren();
    const tile = el('div', 'ev-card-icon', this.evCard);
    if (item.evidence) paintItem(tile, item.evidence);
    else if (item.profile) paintFace(el('span', 'ev-card-face', tile), item.profile);
    el('div', 'ev-card-name', this.evCard, item.name);
    replay(this.evCard, 'on');
  }
}

function placeholder(name: string, color: string): HTMLElement {
  const wrap = el('div', 'ph');
  wrap.style.setProperty('--ph', color);
  wrap.innerHTML = `
    <svg viewBox="0 0 400 600" aria-hidden="true">
      <path class="ph-body" d="M40 600 C44 470 104 418 200 410 C296 418 356 470 360 600 Z"/>
      <rect class="ph-body" x="170" y="320" width="60" height="110" rx="24"/>
      <ellipse class="ph-body" cx="200" cy="236" rx="92" ry="108"/>
      <path class="ph-shade" d="M108 236 C108 150 160 120 200 120 C250 120 300 150 296 230 C270 180 160 176 108 236 Z"/>
      <text x="200" y="540" text-anchor="middle">${name}</text>
    </svg>`;
  return wrap;
}
