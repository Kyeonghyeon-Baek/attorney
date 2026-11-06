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
  // 제2화 (face crops are re-measured once the sprites exist)
  soyoon: { id: 'soyoon', name: '한소윤', pos: 'defendant', voice: 'mid', color: '#B83A3A', face: [0.5, 0.25, 2.4] },
  ahn: { id: 'ahn', name: '안태수', pos: 'witness', voice: 'warm', color: '#2E4A7A', face: [0.5, 0.25, 2.4] },
  okbun: { id: 'okbun', name: '신옥분', pos: 'witness', voice: 'granny', color: '#4B4F8C', face: [0.5, 0.27, 2.3] },
  jeongsuk: { id: 'jeongsuk', name: '배정숙', pos: 'witness', voice: 'high', color: '#A0577A', face: [0.5, 0.26, 2.4] },
  cheolju: { id: 'cheolju', name: '윤철주', pos: 'witness', voice: 'gruff', color: '#6A6F73', face: [0.5, 0.27, 2.4] },
  haneul: { id: 'haneul', name: '도하늘', pos: 'witness', voice: 'young', color: '#8DB33A', face: [0.5, 0.27, 2.4] },
  byeon: { id: 'byeon', name: '변복만', pos: 'witness', voice: 'deep', color: '#8A6A3A', face: [0.5, 0.25, 2.4] },
  eungyeol: { id: 'eungyeol', name: '노은결', pos: 'witness', voice: 'soft', color: '#C9A13A', face: [0.5, 0.26, 2.4] },
  foreman: { id: 'foreman', name: '공사 반장', pos: 'field', voice: 'gruff', color: '#7A6A5A', offscreen: true },
  elder: { id: 'elder', name: '어르신', pos: 'field', voice: 'granny', color: '#8A7A6A', offscreen: true },
  choi: { id: 'choi', name: '최봉구', pos: 'field', voice: 'gruff', color: '#6B5A4A', offscreen: true },
  app: { id: 'app', name: '집값닷AI', pos: 'field', voice: 'device', color: '#2BB6C9', offscreen: true },
  radio: { id: 'radio', name: '라디오', pos: 'field', voice: 'device', color: '#9A8A6A', offscreen: true },
};
