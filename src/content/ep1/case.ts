import { cgImage } from '../../engine/assets';
import type { CaseData, Checkpoint } from '../../engine/game';
import { say, think } from '../script';
import { ANN_AUTOPSY, ANN_CALL112, ANN_RECORDER, ANN_SHARE, FINALE_SCENES, FINALE_TESTIMONIES } from './finale';
import { OPENING_SCENES } from './opening';
import { EVIDENCE, PROFILES } from './records';
import { TAPE_SCENES, TAPE_TESTIMONIES } from './tape';
import { TRIAL_SCENES, TRIAL_TESTIMONIES } from './trial';

// 제1화 「무인(無人)의 밤」 — 시리즈의 첫 사건이자 튜토리얼 (개정 EP1-R4).
// 범인을 먼저 보여 주는 도치 서술. 녹음기가 담은 02:41의 첫 폭행을 사망 순간으로 읽을 뻔하다가,
// 오정택의 인정 뒤에도 치명상 시각이 남는다는 것을 확인하고, 상처 조각 감정 + 112 현장 공유 사진 + 골목 녹음으로
// 태오가 그 10초에 없었음을 자백 전에 입증한다.
// 줄거리는 docs/series-bible.md, 논리 설계와 정답표는 docs/ep1-rewrite.md, 진상 시간표는 records.ts 맨 위에 있다.

const BASE = ['iguardLog', 'autopsy', 'scenePhoto', 'sceneItems', 'layout', 'shutterPhoto', 'call112', 'share112'];

const CHECKPOINTS: Record<string, Checkpoint> = {
  trial: {
    label: '1. 첫 공판',
    // The prosecution hands the rest over during its opening statement.
    evidence: ['shutterPhoto'],
    flags: ['ep1:foodTold', 'memo:[장면 선택] 태오: 봉지는 점주가 허락해 온 폐기 음식, 받는 분은 조말순 할머니. 할머니께 출석 요청.'],
    gauge: 96.4,
    status: '신고 내용 미검증',
  },
  witness1: {
    label: '2. 오정택의 첫 목격 증언',
    evidence: BASE,
    flags: [
      'issue|그날 밤 창고에 있던 사람은 태오 씨뿐이었나?', 'ep1:foodTold',
      'memo:[장면 선택] 아이가드의 "1명"은 매장 구역의 관측. 창고 구석과 뒷문은 카메라 밖.',
    ],
    gauge: 90.2,
    status: '진술 검토 중',
  },
  grandma: {
    label: '3. 조말순 할머니의 증언',
    evidence: [...BASE, 'oh'],
    flags: [
      'ep1:foodTold', 'memo:[장면 선택] 셔터 때문에 "봤다"는 철회. 02:45 무렵 태오는 CAM1에 계속 찍혔다.',
    ],
    gauge: 69.1,
    status: '진술 검토 중',
  },
  tape: {
    label: '4. 녹음기',
    evidence: [...BASE, 'oh', 'malsun', 'samgak', 'recorder'],
    flags: [
      'issue|봉지 속은 무엇이었나? 「무단 반출」은 절도였나?', 'ep1:foodTold', 'ep1:recorderFound',
      'memo:[장면 선택] 봉지는 점주가 허락해 온 폐기 음식. 그 바닥에서 녹음기가 나왔다.',
    ],
    gauge: 60.9,
    status: '진술 검토 중',
  },
  afternoon: {
    label: '5. 오후 도어락 심문',
    evidence: [...BASE, 'oh', 'malsun', 'samgak', 'recorder', 'watchLog', 'doorLog'],
    flags: [
      'ep1:foodTold', 'ep1:recorderFound', 'ep1:firstAssault',
      'memo:[장면 선택] 02:41 첫 폭행은 오정택(본인 인정). 머리 치명상이 언제 생겼는지는 아직. 오정택: "02:45쯤 나갔다".',
    ],
    gauge: 48.0,
    status: '치명상 시점 미확인',
  },
  callcross: {
    label: '6. 상패와 머리 손상 심문',
    evidence: [...BASE, 'oh', 'malsun', 'samgak', 'recorder', 'watchLog', 'doorLog'],
    flags: [
      'issue|상패가 깨질 때 머리도 다쳤나? 그렇다면 언제였나?',
      'ep1:foodTold', 'ep1:recorderFound', 'ep1:firstAssault', 'ep1:ohStayed', 'ep1:taeoOutside', `ann:call112|${ANN_CALL112}`, `ann:recorder|${ANN_RECORDER}`,
      'memo:[장면 선택] 오정택은 02:57까지 창고 안에 있었다(도어락). 통화 중 태오는 골목에 있었다(녹음기·도어락).',
    ],
    gauge: 42.0,
    status: '치명상 시점 미확인',
  },
  result: {
    label: '7. 오후 4시 감정 결과',
    evidence: [...BASE, 'oh', 'malsun', 'samgak', 'recorder', 'watchLog', 'doorLog'],
    flags: [
      'ep1:foodTold', 'ep1:recorderFound', 'ep1:firstAssault', 'ep1:ohStayed', 'ep1:taeoOutside', 'ep1:compareNeeded', `ann:call112|${ANN_CALL112}`, `ann:recorder|${ANN_RECORDER}`,
      'memo:[장면 선택] 상처 속 조각과 가방 속 판 본체의 대조 결과를 기다렸다(오후 4시).',
    ],
    gauge: 42.0,
    status: '감정 대기',
  },
  epilogue: {
    label: '8. 판결 뒤 에필로그',
    evidence: [...BASE, 'oh', 'malsun', 'samgak', 'recorder', 'watchLog', 'doorLog'],
    flags: [
      'ep1:foodTold', 'ep1:recorderFound', 'ep1:firstAssault', 'ep1:ohStayed', 'ep1:taeoOutside', 'ep1:compareNeeded',
      'ep1:fragmentMatch',
      'ep1:injuryWindow', 'ep1:defenseComplete', 'ep1:reportFalse', 'photomark:share112',
      `ann:call112|${ANN_CALL112}`, `ann:recorder|${ANN_RECORDER}`, `ann:autopsy|${ANN_AUTOPSY}`, `ann:share112|${ANN_SHARE}`,
    ],
    gauge: 0,
    status: '심리 종료',
  },
};

export const CASE_EP1: CaseData = {
  // r4: 2026-10 네 번째 개정(EP1-R4: 초반 정보 배치·법정 화면·튜토리얼 안내·유머). 예전 저장은 이어하지 않고 지우지도 않는다.
  id: 'case1-orot-r4',
  revision: 'EP1-R4',
  legacyIds: ['case1-orot', 'case1-orot-v2', 'case1-orot-r2', 'case1-orot-r3'],
  ep: 1,
  menu: {
    no: '제1화',
    title: '무인(無人)의 밤',
    tagline: '새벽 두 시, 무인 편의점의 창고. 감시 AI는 야간 관리원의 친절을 절도로 분류했다.',
    thumb: cgImage('alley'),
  },
  caseNo: '2031고합103',
  caseName: '살인  피고인 신태오',
  episode: '제1화 「무인(無人)의 밤」',
  start: 'prologue',
  evidence: EVIDENCE,
  startEvidence: [],
  profiles: PROFILES,
  testimonies: { ...TRIAL_TESTIMONIES, ...TAPE_TESTIMONIES, ...FINALE_TESTIMONIES },
  locations: {},
  gaugeStart: 96.4,
  gaugeStatus: '신고 내용 미검증',
  wrongPenalty: 0,
  chances: 3,
  hintMode: 'manual',
  checkpoints: CHECKPOINTS,
  // 반대신문은 늘 같은 곡으로, 증인과의 대화는 증인의 테마로. 정답이 꽂히는 순간 음악이 끊긴다.
  crossBgm: 'cross',
  cutMusicOnObjection: true,

  defaultPress: [
    think('(…더 캐물을 건 없어 보여.)'),
  ],
  defaultWrong: [
    say('eom', '변호인. 그 증거가 지금 증언과 무슨 상관입니까?', 'smug'),
    say('judge', '변호인, 증거는 신중하게 제시해 주십시오.', 'stern'),
  ],
  presentWrong: [
    say('eom', '…그 증거로 무엇을 증명하겠다는 겁니까, 변호인?', 'smug'),
    say('judge', '변호인, 다시 생각해 보세요.', 'stern'),
  ],
  loopBack: [],
  gameOver: [],
  fieldPresentDefault: [
    think('(…지금 보여 줄 만한 건 아닌 것 같아.)'),
  ],

  sceneLabels: {
    prologue: '프롤로그: 그날 밤',
    morning: '국선변호인 사무실: 강단비',
    lobby: '3월 17일 비공개 면담',
    trial: '개정: 법정 화면과 모두진술',
    cross0: '반대신문: 사건 개요',
    witness1: '목격자이자 신고자, 오정택',
    cross1: '반대신문: 제가 본 것',
    cross2: '반대신문: 골목에서 들은 소리',
    recess: '휴정: 피고인 대기실',
    grandma: '증인 조말순',
    tape: '방대식의 녹음기',
    cross3: '반대신문: 녹음 속 사람',
    watch: '시계 대조와 첫 폭행',
    lunch: '점심 휴정: 확실한 것부터',
    afternoon: '오후 재개정: 도어락 기록',
    cross4: '반대신문: 남은 시간',
    outside: '통화 중, 피고인은 어디에',
    callcross: '반대신문: 상패와 머리 손상',
    waiting: '감정 결과 대기',
    result: '오후 4시 감정 결과',
    lastword: '마지막 확인',
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
    ...TAPE_SCENES,
    ...FINALE_SCENES,
  },
};
