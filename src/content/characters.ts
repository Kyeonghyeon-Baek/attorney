import type { CharId, Character } from '../engine/types';

export const CHARACTERS: Record<CharId, Character> = {
  dan: { id: 'dan', name: '강단비', pos: 'defense', voice: 'mid', color: '#3B4F8F' },
  narae: { id: 'narae', name: '신나래', pos: 'counsel', voice: 'high', color: '#B8473A' },
  eom: { id: 'eom', name: '엄정한', pos: 'prosecution', voice: 'low', color: '#4A4F5C' },
  judge: { id: 'judge', name: '재판장', pos: 'judge', voice: 'deep', color: '#5B4A6B' },
  daon: { id: 'daon', name: '다온', pos: 'witness', voice: 'ai', color: '#3FB8B0' },
  soonja: { id: 'soonja', name: '박순자', pos: 'defendant', voice: 'warm', color: '#9A7B5A' },
  operator: { id: 'operator', name: '???', pos: 'witness', voice: 'soft', color: '#C98A4B' },
  haeun: { id: 'haeun', name: '박하은', pos: 'witness', voice: 'soft', color: '#C98A4B' },
  seo: { id: 'seo', name: '서지훈', pos: 'field', voice: 'low', color: '#6B5B8C' },
  gu: { id: 'gu', name: '구만두', pos: 'field', voice: 'gruff', color: '#9C7A4E' },
};
