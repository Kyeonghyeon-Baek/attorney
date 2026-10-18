import { cgImage } from '../../engine/assets';
import type { CaseData } from '../../engine/game';
import { say, think } from '../script';
import { FINALE_SCENES, FINALE_TESTIMONIES } from './finale';
import { OPENING_SCENES } from './opening';
import { EVIDENCE, PROFILES } from './records';
import { TRIAL_SCENES, TRIAL_TESTIMONIES } from './trial';

// 제1화 「무인(無人)의 밤」 — 시리즈의 첫 사건이자 튜토리얼.
// 범인을 먼저 보여 주는 도치 서술. 플레이어는 "누가"가 아니라 "어떻게 증명하나"를 푼다.
// 줄거리와 진상은 docs/series-bible.md, 증거의 진상 타임라인은 records.ts 맨 위에 있다.

export const CASE_EP1: CaseData = {
  id: 'case1-orot',
  ep: 1,
  menu: {
    no: '제1화',
    title: '무인(無人)의 밤',
    tagline: '새벽 두 시, 무인 편의점의 창고. 감시 AI는 야간 관리원의 친절을 절도로 읽었다.',
    thumb: cgImage('alley'),
  },
  caseNo: '2031고합103',
  caseName: '살인  피고인 신태오',
  episode: '제1화 「무인(無人)의 밤」',
  start: 'prologue',
  evidence: EVIDENCE,
  startEvidence: [],
  profiles: PROFILES,
  testimonies: { ...TRIAL_TESTIMONIES, ...FINALE_TESTIMONIES },
  locations: {},
  gaugeStart: 96.4,
  wrongPenalty: 2.4,
  // 반대신문은 늘 같은 곡으로, 증인과의 대화는 증인의 테마로. 정답이 꽂히는 순간 음악이 끊긴다.
  crossBgm: 'cross',
  cutMusicOnObjection: true,

  defaultPress: [
    think('(…더 캐물을 건 없어 보여.)'),
  ],
  defaultWrong: [
    say('eom', '변호인. 그 증거가 지금 증언과 무슨 상관입니까?', 'smug'),
    say('judge', '변호인, 증거는 신중하게 제시해 주십시오. 이것도 {r}판관{/}의 계산에 들어갑니다.', 'stern'),
  ],
  presentWrong: [
    say('eom', '…그 증거로 무엇을 증명하겠다는 겁니까, 변호인?', 'smug'),
    say('judge', '변호인, 다시 생각해 보세요. 이것도 {r}판관{/}의 계산에 들어갑니다.', 'stern'),
  ],
  loopBack: [
    think('(증언이 한 바퀴 돌았어. 처음부터 다시 살펴보자.)'),
  ],
  gameOver: [
    say('eom', '보십시오, 재판장님. 판관은 처음부터 답을 알고 있었습니다.', 'smug'),
    say('judge', '…그렇군요. 피고인 신태오에게 판결을 선고합니다.', 'stern'),
  ],
  fieldPresentDefault: [
    think('(…지금 보여 줄 만한 건 아닌 것 같아.)'),
  ],

  sceneLabels: {
    prologue: '프롤로그: 그날 밤',
    lobby: '3월 17일 피고인 대기실',
    trial: '개정: 판관 예측 96.4%',
    cross0: '반대신문: 사건 개요',
    witness1: '목격자 오정택',
    cross1: '반대신문: 제가 본 것',
    cross2: '반대신문: 골목에서 들은 소리',
    silence: '피고인의 침묵',
    recess: '휴정: 피고인 대기실',
    grandma: '증인 조말순',
    tape: '방대식의 녹음기',
    cross3: '반대신문: 기계가 증명합니다',
    cross4: '반대신문: 창고 안은 모릅니다',
    finale: '마지막 증거',
    breakdown: '오정택의 고백',
    verdict: '판결',
    epilogue: '에필로그: 밥은 먹었어?',
    office: '에필로그: 국선 사무실',
  },
  endingTitle: '제1화 「무인(無人)의 밤」 끝',
  endingNote: '다음 사건 — 제2화 「재개발의 한(恨)」 · 준비 중',

  scenes: {
    ...OPENING_SCENES,
    ...TRIAL_SCENES,
    ...FINALE_SCENES,
  },
};
