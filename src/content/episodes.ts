import type { EpisodeSlot } from '../engine/game';
import { CASE_DAON } from './case-daon';
import { CASE_EP1 } from './ep1/case';

/** 사건 기록부, in order. Episodes without a case yet are listed as locked. */
export const EPISODES: EpisodeSlot[] = [
  CASE_EP1,
  {
    locked: true, no: '제2화', title: '재개발의 한(恨)',
    tagline: '숫자로 매겨진 집에, 사람이 산다.',
  },
  {
    locked: true, no: '제3화', title: '목소리를 훔친 밤',
    tagline: '목소리를 빼앗긴 사람. 그리고 오 년 전의 판결.',
  },
  CASE_DAON,
];
