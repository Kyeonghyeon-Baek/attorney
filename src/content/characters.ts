import type { CharId, Character } from '../engine/types';

// `face`: where the face sits in each sprite, measured on normal.png, and the crop zoom for face photos.
export const CHARACTERS: Record<CharId, Character> = {
  dan: { id: 'dan', name: '강단비', pos: 'defense', voice: 'mid', color: '#3B4F8F', face: [0.6, 0.23, 2.5] },
  narae: { id: 'narae', name: '신나래', pos: 'counsel', voice: 'high', color: '#B8473A', face: [0.565, 0.24, 2.4] },
  eom: { id: 'eom', name: '엄정한', pos: 'prosecution', voice: 'low', color: '#4A4F5C', face: [0.47, 0.165, 2.5] },
  judge: { id: 'judge', name: '재판장', pos: 'judge', voice: 'deep', color: '#5B4A6B', face: [0.48, 0.245, 2.3] },
  gu: { id: 'gu', name: '구만두', pos: 'witness', voice: 'gruff', color: '#9C7A4E', face: [0.49, 0.195, 2.4] },
  // 제4화
  daon: { id: 'daon', name: '다온', pos: 'witness', voice: 'ai', color: '#3FB8B0' },
  soonja: { id: 'soonja', name: '박순자', pos: 'defendant', voice: 'warm', color: '#9A7B5A', face: [0.515, 0.27, 2.3] },
  operator: { id: 'operator', name: '???', pos: 'witness', voice: 'soft', color: '#C98A4B' },
  haeun: { id: 'haeun', name: '박하은', pos: 'witness', voice: 'soft', color: '#C98A4B', face: [0.5, 0.285, 2.4] },
  seo: { id: 'seo', name: '서지훈', pos: 'witness', voice: 'low', color: '#6B5B8C', face: [0.49, 0.21, 2.4] },
  // 제1화
  taeo: { id: 'taeo', name: '신태오', pos: 'defendant', voice: 'young', color: '#D9644C', face: [0.5, 0.265, 2.5] },
  oh: { id: 'oh', name: '오정택', pos: 'witness', voice: 'slick', color: '#2F3E73', face: [0.49, 0.255, 2.5] },
  malsun: { id: 'malsun', name: '조말순', pos: 'witness', voice: 'granny', color: '#9A6B4E', face: [0.51, 0.28, 2.3] },
  bang: { id: 'bang', name: '방대식', pos: 'field', voice: 'gruff', color: '#7A6A5A', offscreen: true },
  watch: { id: 'watch', name: '스마트워치', pos: 'field', voice: 'device', color: '#2BB6C9', offscreen: true },
  iguard: { id: 'iguard', name: '아이가드', pos: 'field', voice: 'device', color: '#C8372D', offscreen: true },
};
