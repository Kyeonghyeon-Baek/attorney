import type { Recap } from '../../engine/types';

// 「이번 공방」 pages (court record → 이번 공방), one per stretch of the trial. Each lists only what the
// player has already settled at that point, never the answer to the question still open. Checkpoints
// reuse the same objects so a scene jump shows what normal play would.

export const RECAP_TRIAL: Recap = {
  question: '그날 밤 창고에 있던 사람은 태오 씨뿐이었을까?',
  facts: ['태오 씨는 2시 50분에 창고에 들어갔다가 2시 52분에 봉지를 들고 나갔다(CAM3).', '검찰은 그 2분 사이에 태오 씨가 머리를 내리쳤다고 주장한다.'],
  pending: '기록이 보여 주지 않는 곳은 어디일까.',
};

export const RECAP_OUTLINE: Recap = {
  question: '신고자는 무엇을 직접 보았을까?',
  facts: ['아이가드의 「1명」은 매장(CAM1)에서 확인한 인원이다.', '창고 구석과 뒷문은 어느 카메라에도 보이지 않는다.'],
  pending: '신고자가 무엇을 근거로 말하는지.',
};

export const RECAP_RECESS: Recap = {
  question: '봉지와 그날 밤 상황을 누가 설명할 수 있을까?',
  facts: ['「유리창 너머로 봤다」는 철회됐다. 그날 셔터는 내려가 있었다.', '2시 45분 무렵 태오 씨는 매장에 있었다(CAM1).'],
  pending: '봉지를 받은 사람의 이야기.',
};

export const RECAP_TAPE: Recap = {
  question: '태오 씨보다 먼저 창고에서 사장님과 충돌한 사람은 누구일까?',
  facts: ['2시 41분 첫 충돌 때 태오 씨는 매장에 있었다(녹음기 · CAM1).', '녹음기는 2시 52분부터 봉지에 담겨 골목에 있었다.'],
  pending: '녹음 속 남자가 누구인지.',
};

export const RECAP_ASSAULT: Recap = {
  question: '사장님의 머리 손상은 언제 생겼을까?',
  facts: ['2시 41분 첫 폭행은 오정택이 했다(본인 인정 · 시계 경고).', '부검상 머리 손상은 손목·옆구리 상처와 별개다.'],
  pending: '첫 폭행 뒤 오정택과 태오 씨가 각각 어디에 있었는지.',
};

export const RECAP_OUTSIDE: Recap = {
  question: '머리 손상과 깨진 상패는 어떻게 연결될까?',
  facts: [
    '오정택은 112 통화가 끝날 때까지 창고 안에 있었다(퇴장 진술 철회).',
    '태오 씨는 나간 뒤 골목에 있었고, 돌아올 때는 경찰·구급대와 함께였다.',
  ],
  pending: '상처 속 조각이 어디에서 왔는지.',
};

export const RECAP_WAITING: Recap = {
  question: '상처 속 조각은 어디에서 왔을까?',
  facts: ['상처 속 조각 · 현장 조각 · 가방 속 판 본체를 대조하고 있다.', '태오 씨가 나간 뒤 돌아올 때까지의 행적은 확인했다.'],
  pending: '오후 4시 감정 결과.',
};

/** The same page after the photo was shown early in 「상패와 머리 손상」 (`ep1:plateWindow`). */
export const RECAP_WAITING_PLATE: Recap = {
  question: '상처 속 조각은 어디에서 왔을까?',
  facts: [
    '상처 속 조각 · 현장 조각 · 가방 속 판 본체를 대조하고 있다.',
    '상패 판은 02:55:48~58 사이에 깨졌다(현장 공유 사진).',
    '태오 씨가 나간 뒤 돌아올 때까지의 행적은 확인했다.',
  ],
  pending: '오후 4시 감정 결과.',
};

export const RECAP_RESULT: Recap = {
  question: '감정 결과와 사진을 함께 보면 무엇이 달라질까?',
  facts: ['태오 씨가 나간 뒤 돌아올 때까지의 행적은 확인했다.', '감정 결과가 도착했다(부검 소견서 덧붙임).'],
  pending: '두 자료를 이으면 검찰의 설명에서 무엇이 바뀌는지.',
};

export const RECAP_MEANING: Recap = {
  question: '처음 신고는 확인된 사실과 맞을까?',
  facts: [
    '태오 씨가 창고에 있던 때 그 머리 손상이 생겼다는 설명은 무너졌다.',
    '돌아올 때도 경찰·구급대가 함께였다.',
  ],
  pending: '신고자가 무엇을 보고 「머리를 다쳤다」고 했는지.',
};
