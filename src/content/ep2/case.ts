import { cgImage } from '../../engine/assets';
import type { CaseData, Checkpoint } from '../../engine/game';
import type { Cmd } from '../../engine/types';
import { recapFlag, say, think } from '../script';
import { FINALE_SCENES, FINALE_TESTIMONIES } from './finale';
import { DAY1_LOCATIONS, DAY1_SCENES } from './investigation1';
import { DAY2_LOCATIONS, DAY2_SCENES } from './investigation2';
import { OPENING_SCENES } from './opening';
import { RECAP_ARRIVED, RECAP_FALL, RECAP_HAND, RECAP_MOTIVE, RECAP_PRICE, RECAP_REMOTE } from './recaps';
import { EVIDENCE, PROFILES } from './records';
import { TRIAL1_SCENES, TRIAL1_TESTIMONIES } from './trial1';
import { TRIAL2_SCENES, TRIAL2_TESTIMONIES } from './trial2';

// 제2화 「재개발의 한(恨)」 — 조사 + 법정 이틀 (설계 EP2-D2, docs/ep2/).
// 옥상에 없던 사람이, 그 4분 동안 피해자의 휴대폰 화면을 보며 귀에 대고 말하고 있었다.
// 진상 시간표는 records.ts 맨 위, 입증 구조는 docs/ep2/case-truth.md, 장면 흐름은 docs/ep2/play-flow.md.

/**
 * The court-record edits (annotate · revise) in these scripts, as the flags a save holds, so a
 * checkpoint starts with the same addenda and later versions (4K video, full homecam…) normal play has.
 */
function edits(...sources: unknown[]): string[] {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    const c = v as Cmd;
    if (c.t === 'annotate') out.push(`ann:${c.id}|${c.text}`);
    else if (c.t === 'revise') out.push(`rev:${c.id}|${c.summary}`);
    else Object.values(v).forEach(walk);
  };
  sources.forEach(walk);
  // A summary written in several places (one per order of finds) counts where it is written last, so
  // a checkpoint's final revision is the one normal play ends on; addenda keep their first place.
  return out.filter((x, i) => (x.startsWith('rev:') ? out.lastIndexOf(x) === i : out.indexOf(x) === i));
}

const ED1 = edits(DAY1_LOCATIONS);
const ET1AM = [...ED1, ...edits(TRIAL1_SCENES.tape119)];
const ET1 = [...ED1, ...edits(TRIAL1_SCENES, TRIAL1_TESTIMONIES)];
const ED2 = [...ET1, ...edits(DAY2_LOCATIONS, DAY2_SCENES)];
const ET2 = [...ED2, ...edits(TRIAL2_SCENES.trial2)];
// After the round-5 briefing (ahnStand3): the server reply's account record is on its card.
const ET2B = edits(TRIAL2_SCENES.ahnStand3);

// Evidence, plus the people met so far (profiles marked `later`).
const D1 = [
  'roofScene', 'postmortem', 'phoneScreen', 'firstStatement', 'dalbitMap', 'roofDoorLog', 'appraisal', 'groupVideo',
  'ahn', 'okbun', 'jeongsuk', 'eungyeol', 'byeon',
];
const D1_FLAGS = ['d1:windowShot', 'd1:soyoonRoof', 'd1:okbunTalk', 'd1:ahnMet', 'd1:appFail', 'd1:namsanTalk', 'd1:ahnCard', 'd1:boilerCode'];
const T1 = [...D1, 'snsPost', 'call119', 'homecam', 'moveInPhoto', 'inspection', 'cheolju'];
const T1_FLAGS = [...D1_FLAGS, 't1:q07', 't1:code7', ...ET1];
const D2 = [...T1, 'looseParts', 'originals', 'ladderLog', 'phoneDump', 'haneul'];
const D2_FLAGS = [
  ...T1_FLAGS, 'd2:video4k', 'd2:laundryBag', 'd2:binBag', 'd2:strapSeen', 'd2:soyoonConsent', 'd2:signMeasured',
  'd2:cctvAsked', 'd2:call15', 'd2:noticeRead', 'd2:textsRead', 'd2:prosecutorDone', 'd2:homecamFull', ...ED2,
];
const T2 = [...D2, 'hallCctv', 'railReport'];
const T2_FLAGS = [...D2_FLAGS, 't2:messengerIn', ...ET2];

const CHECKPOINTS: Record<string, Checkpoint> = {
  day1: { label: '1. 1일차 조사', evidence: [], flags: [], gauge: 89.4, status: '조사 중' },
  trial1: {
    label: '2. 1일차 개정', evidence: D1, flags: [...D1_FLAGS, ...ED1], gauge: 89.4, status: '진술 검토 중',
  },
  recess1: {
    label: '3. 휴정: 피고인 대기실', evidence: [...D1, 'snsPost', 'call119', 'homecam'],
    flags: [...D1_FLAGS, ...ET1AM, recapFlag(RECAP_FALL)], gauge: 83.0, status: '진술 검토 중',
  },
  ahnStand: {
    label: '4. 제2 공방: 안태수', evidence: [...D1, 'snsPost', 'call119', 'homecam', 'moveInPhoto'],
    flags: [...D1_FLAGS, ...ET1AM, recapFlag(RECAP_PRICE)], gauge: 83.0, status: '진술 검토 중',
  },
  afternoon1: {
    label: '5. 1일차 오후', evidence: [...D1, 'snsPost', 'call119', 'homecam', 'moveInPhoto'],
    flags: [...D1_FLAGS, 't1:q07', 't1:code7', ...ET1AM, recapFlag(RECAP_PRICE)], gauge: 78.5, status: '진술 검토 중',
  },
  day2: { label: '6. 2일차 조사', evidence: T1, flags: T1_FLAGS, gauge: 93.1, status: '사전 훼손 가능성' },
  trial2: {
    label: '7. 2일차 개정: 구조 감정', evidence: [...D2, 'hallCctv'], flags: [...D2_FLAGS, recapFlag(RECAP_HAND)],
    gauge: 93.1, status: '사전 훼손 가능성',
  },
  ahnStand2: {
    label: '8. 제4 공방: 원격 지원', evidence: T2, flags: [...T2_FLAGS, recapFlag(RECAP_REMOTE)], gauge: 61.0, status: '계획성 지표 해제',
  },
  ahnStand3: {
    label: '9. 제5 공방: 다 온 줄 알았다', evidence: [...T2, 'serverReply'],
    flags: [...T2_FLAGS, 't2:callOne', recapFlag(RECAP_ARRIVED)], gauge: 34.0, status: '피고인의 가해 주장 철회',
  },
  motive: {
    label: '10. 제6 공방: 동기', evidence: [...T2, 'serverReply'],
    flags: [...T2_FLAGS, ...ET2B, 't2:callOne', 't2:x7a', 't2:x7b', 't2:x7c', 't2:x7d', 't2:x7e', recapFlag(RECAP_MOTIVE)],
    gauge: 21.0, status: '가해 주장 철회 · 예측 근거 재검토',
  },
  epilogue: { label: '11. 에필로그', evidence: [...T2, 'serverReply'], flags: [...T2_FLAGS, ...ET2B], gauge: 0, status: '심리 종료' },
};

export const CASE_EP2: CaseData = {
  id: 'case2-dalbit',
  revision: 'EP2-D2',
  ep: 2,
  menu: {
    no: '제2화',
    title: '재개발의 한(恨)',
    tagline: '숫자로 매겨진 집에, 사람이 산다.',
    thumb: cgImage('dusk-roof'),
  },
  caseNo: '2031고합217',
  caseName: '살인  피고인 한소윤',
  episode: '제2화 「재개발의 한(恨)」',
  start: 'prologue',
  evidence: EVIDENCE,
  startEvidence: [],
  profiles: PROFILES,
  testimonies: { ...TRIAL1_TESTIMONIES, ...TRIAL2_TESTIMONIES, ...FINALE_TESTIMONIES },
  locations: { ...DAY1_LOCATIONS, ...DAY2_LOCATIONS },
  gaugeStart: 89.4,
  gaugeStatus: '조사 중',
  wrongPenalty: 0,
  chances: 3,
  hintMode: 'manual',
  checkpoints: CHECKPOINTS,
  crossBgm: 'cross',
  cutMusicOnObjection: true,

  defaultPress: [think('(…더 캐물을 건 없어 보여.)')],
  defaultWrong: [
    say('eom', '변호인. 그 자료가 지금 증언의 어디와 부딪힙니까?', 'normal'),
    say('judge', '변호인, 증거는 신중하게 제시해 주십시오.', 'stern'),
  ],
  presentWrong: [
    say('eom', '…그 자료로 무엇을 증명하겠다는 겁니까, 변호인?', 'smug'),
    say('judge', '변호인, 다시 생각해 보세요.', 'stern'),
  ],
  loopBack: [],
  gameOver: [],
  fieldPresentDefault: [think('(…지금 보여 줄 만한 건 아닌 것 같아.)')],

  sceneLabels: {
    prologue: '프롤로그: 노을 속 두 그림자',
    office: '국선변호인 사무실: 배당',
    day1: '1일차 조사: 달빛마을',
    day1night: '1일차 저녁: 신당 마당',
    lobby1: '6월 17일 대기실',
    trial1: '개정: 모두진술',
    witness2: '목격자 배정숙',
    witness2b: '배정숙의 고친 증언',
    tape119: '119 신고 원음',
    homecam1: '홈캠 발췌',
    recess1: '휴정: 피고인 대기실',
    ahnStand: '제2 공방: 안태수',
    lunch1: '점심 휴정',
    afternoon1: '1일차 오후: 계획성 지표',
    night1: '1일차 밤',
    day2: '2일차 조사: 멈춘 공사',
    day2eve: '2일차 저녁: 노을의 옥상',
    lobby2: '6월 19일 법원 복도',
    trial2: '2일차 개정: 구조 감정',
    ahnStand2: '제4 공방: 원격 지원',
    ahnCall: '반대신문: 통화 상대',
    clip: '인증 클립: 그의 목소리',
    ahnStand3: '제5 공방: 다 온 줄 알았다',
    sixLinks: '여섯 고리',
    motive: '제6 공방: 동기',
    minus040: '−0.40의 정체',
    breakdown: '안태수의 붕괴',
    verdict: '판결',
    epilogue: '에필로그: 이사 날',
  },
  endingTitle: '제2화 「재개발의 한(恨)」 끝',
  endingNote: '다음 사건 — 제3화 「목소리를 훔친 밤」 · 준비 중',

  scenes: {
    ...OPENING_SCENES,
    ...DAY1_SCENES,
    ...TRIAL1_SCENES,
    ...DAY2_SCENES,
    ...TRIAL2_SCENES,
    ...FINALE_SCENES,
  },
};
