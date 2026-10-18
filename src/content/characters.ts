import type { CharId, Character } from '../engine/types';

export const CHARACTERS: Record<CharId, Character> = {
  dan: { id: 'dan', name: '강단비', pos: 'defense', voice: 'mid', color: '#3B4F8F' },
  narae: { id: 'narae', name: '신나래', pos: 'counsel', voice: 'high', color: '#B8473A' },
  eom: { id: 'eom', name: '엄정한', pos: 'prosecution', voice: 'low', color: '#4A4F5C' },
  judge: { id: 'judge', name: '재판장', pos: 'judge', voice: 'deep', color: '#5B4A6B' },
  gu: { id: 'gu', name: '구만두', pos: 'witness', voice: 'gruff', color: '#9C7A4E' },
  // 제4화
  daon: { id: 'daon', name: '다온', pos: 'witness', voice: 'ai', color: '#3FB8B0' },
  soonja: { id: 'soonja', name: '박순자', pos: 'defendant', voice: 'warm', color: '#9A7B5A' },
  operator: { id: 'operator', name: '???', pos: 'witness', voice: 'soft', color: '#C98A4B' },
  haeun: { id: 'haeun', name: '박하은', pos: 'witness', voice: 'soft', color: '#C98A4B' },
  seo: { id: 'seo', name: '서지훈', pos: 'witness', voice: 'low', color: '#6B5B8C' },
  // 제1화
  taeo: { id: 'taeo', name: '신태오', pos: 'defendant', voice: 'young', color: '#D9644C' },
  oh: { id: 'oh', name: '오정택', pos: 'witness', voice: 'slick', color: '#2F3E73' },
  malsun: { id: 'malsun', name: '조말순', pos: 'witness', voice: 'granny', color: '#9A6B4E' },
  bang: { id: 'bang', name: '방대식', pos: 'field', voice: 'gruff', color: '#7A6A5A', offscreen: true },
  watch: { id: 'watch', name: '스마트워치', pos: 'field', voice: 'device', color: '#2BB6C9', offscreen: true },
  iguard: { id: 'iguard', name: '아이가드', pos: 'field', voice: 'device', color: '#C8372D', offscreen: true },
};
