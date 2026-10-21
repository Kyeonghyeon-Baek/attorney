import type { EpisodeSlot } from '../engine/game';
import { CASE_EP1 } from './ep1/case';

/** 사건 기록부, in order. Episodes without a case yet are listed as locked. */
export async function loadEpisodes(): Promise<EpisodeSlot[]> {
  // The development-only import is removed entirely from production builds.
  const fourth: EpisodeSlot = import.meta.env.DEV
    ? (await import('./case-daon')).CASE_DAON
    : {
      locked: true, no: '제4화', title: '대체된 증인',
      tagline: 'AI 상담원이 증언대에 섰다. 사람을 대신한다던 그 기계 뒤에는, 사람이 있었다.',
    };
  return [
    CASE_EP1,
    {
      locked: true, no: '제2화', title: '재개발의 한(恨)',
      tagline: '숫자로 매겨진 집에, 사람이 산다.',
    },
    {
      locked: true, no: '제3화', title: '목소리를 훔친 밤',
      tagline: '목소리를 빼앗긴 사람. 그리고 오 년 전의 판결.',
    },
    fourth,
  ];
}
