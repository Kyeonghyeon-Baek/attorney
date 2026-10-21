import { bgImage } from '../engine/assets';
import type { CaseData } from '../engine/game';
import type { Evidence, Profile, Testimony } from '../engine/types';
import { DAY3_EVIDENCE, DAY3_SCENES, DAY3_TESTIMONIES } from './chapter-day3';
import { HAEUN_EVIDENCE, HAEUN_PROFILE, HAEUN_SCENES, HAEUN_TESTIMONIES } from './chapter-haeun';
import { INVESTIGATION_END, INVESTIGATION_GOALS, LOCATIONS } from './investigation';
import {
  addEvidence, ambience, ask, bgm, bigshake, cross, daon, evidence, flash, gauge, goto, investigate,
  option, place, present, reveal, say, sfx, shake, show, think, wait,
} from './script';

// 제4화 「대체된 증인」 — 법정 파트 프로토타입
//
// 진상: 누리랩의 AI 상담원 '다온'은 밤이 되면 혼자 일하지 못했다. AI가 못 받는
// 상담은 외주 인력이 몰래 '다온인 척' 처리했다. 그날 밤 23시 52분의 답장을 쓴
// 사람은 피고인 박순자의 딸, 하은이다.

const EVIDENCE: Evidence[] = [
  {
    id: 'access',
    name: '서버실 출입 기록',
    label: '증 제1호',
    icon: 'door',
    summary: '누리랩 5층 서버실의 사원증 출입 기록. 검찰이 제출했다.',
    detail: [
      '10월 14일',
      '22:05  입실  한도윤 (NR-0001)',
      '23:41  입실  박순자 (NR-0213)',
      '23:58  퇴실  박순자 (NR-0213)',
      '※ 서버실 문은 들어갈 때와 나갈 때 모두 사원증을 찍어야 열린다.',
      '※ 서버실 앞과 안에는 카메라가 없다.',
    ],
  },
  {
    id: 'autopsy',
    name: '부검 소견서',
    label: '증 제2호',
    icon: 'autopsy',
    summary: '피해자 한도윤(41)의 부검 결과.',
    detail: [
      '사망 추정 시각  10월 14일 23:45 ~ 23:55',
      '사인  뒤통수를 강하게 부딪힘 (서버랙 모서리와 일치)',
      '※ 몸싸움의 흔적이 있다.',
    ],
  },
  {
    id: 'cardReturn',
    name: '사원증 반납 확인서',
    label: '증 제3호',
    icon: 'card',
    summary: '누리랩 인사팀이 발행한 서류. 고객센터의 인사팀 보관함에 사본이 꽂혀 있었다.',
    detail: [
      '반납자  박순자 (고객센터 팀장)',
      '반납 물품  사원증 NR-0213',
      '반납일  10월 10일 (해고일)',
      '보관 장소  인사팀 보관함 (임직원 누구나 드나드는 사무실)',
      '※ 반납된 사원증의 출입 권한 해제는 시연회 이후 일괄 처리할 예정이었다.',
      '※ 10월 16일 조사 때, 보관함의 NR-0213 칸은 비어 있었다.',
    ],
  },
  {
    id: 'brochure',
    name: '다온 제품 소개서',
    label: '증 제4호',
    icon: 'brochure',
    summary: '누리랩이 투자 유치용으로 만든 소개서. 「다온, 사람보다 정확한 상담원」',
    detail: [
      '24시간 쉬지 않는 상담',
      '평균 응답 시간 0.3초',
      '모든 응답은 출력 전에 맞춤법 검사 엔진을 반드시 통과합니다. 맞춤법 오류율 0%.',
      '상담원 32명의 업무를 시스템 하나로 대체',
    ],
  },
  {
    id: 'chatLog',
    name: '다온 상담 로그 출력본',
    label: '증 제5호',
    icon: 'log',
    summary: '사건 당일 23:30부터 자정까지 다온이 처리한 고객 상담 7건. 검찰이 서버에서 직접 추출했다.',
    detail: [
      '23:31  배송  "주문하신 상품은 내일 도착 예정입니다."',
      '23:38  요금  "이번 달 요금은 32,400원입니다."',
      '23:44  배송  "확인해 드리겠습니다. 잠시만 기다려 주세요."',
      '23:47  해지  "해지 전에 혜택을 안내해 드려도 될까요?"',
      '23:52  환불  "네 고객님, 환불 처리 다 됬어요."',
      '23:55  요금  "자동이체 날짜는 매달 25일입니다."',
      '23:59  배송  "식사는 하셨어요? 좋은 밤 되세요."',
    ],
  },
];

const PROFILES: Profile[] = [
  {
    id: 'soonja', name: '박순자', meta: '52세 · 피고인', color: '#9A7B5A', sprite: 'soonja',
    summary: '누리랩 고객센터의 20년 차 팀장. 다온이 도입되며 10월 10일에 해고됐다. 사건 당일 23시 20분, 건물 로비로 들어오는 모습이 CCTV에 찍혔다. 딸과 단둘이 산다.',
  },
  {
    id: 'victim', name: '한도윤', meta: '41세 · 피해자', color: '#5C6B7A', face: [0.51, 0.42, 1.45],
    summary: '누리랩 대표. 투자 시연회를 하루 앞둔 밤, 서버실에서 숨진 채 발견됐다.',
  },
  {
    id: 'daon', name: '다온', meta: 'AI 상담원 · 증인', color: '#3FB8B0', orb: true,
    summary: '누리랩의 AI 상담원. 고객 상담과 건물 보안 기록을 맡는다. 대한민국 법정에 선 최초의 AI 증인.',
  },
  {
    id: 'seo', name: '서지훈', meta: '38세 · 누리랩 기술이사', color: '#6B5B8C', sprite: 'seo',
    summary: '다온 개발 책임자. 다온을 "제 인생을 건 작품"이라고 부른다. 사건 당일 밤엔 집에 있었고, 야간 근무 같은 건 없다고 말했다.',
  },
  {
    id: 'gu', name: '구만두', meta: '43세 · 형사', color: '#9C7A4E', sprite: 'gu',
    summary: '이번 사건 담당 형사. 사람은 좋은데 입이 가볍다. 상사에게 "그만둬!" 소리를 자주 듣는다.',
  },
  {
    id: 'eom', name: '엄정한', meta: '32세 · 검사', color: '#4A4F5C', sprite: 'eom',
    summary: '판관의 숫자를 신뢰하는 엘리트 검사. 즉결공판제 도입 뒤 진 재판은 단 세 번, 세 번 모두 상대가 강단비였다.',
  },
  {
    id: 'narae', name: '신나래', meta: '19세 · 조수', color: '#B8473A', sprite: 'narae',
    summary: '무당 집안 막내딸. 단비의 사무소에서 일을 돕는다. 기계는 영 못 믿는다.',
  },
];

// ------------------------------------------------------------------ testimony 1

const NIGHT: Testimony = {
  id: 'night',
  title: '사건 당일 밤의 기록',
  hearing: 'daon',
  statements: [
    {
      id: 'n1', who: 'daon',
      text: '저는 누리랩의 AI 상담원이자, 건물의 보안 기록을 관리하고 있습니다.',
      press: [
        say('dan', '보안 기록이라면… 건물 안의 모든 걸 보고 있다는 건가요?'),
        say('daon', '건물 출입문과 서버실 문의 개폐 기록, 그리고 로비 CCTV 영상을 관리합니다.'),
        say('dan', '서버실 안은요?'),
        say('daon', '서버실 안에는 카메라가 없습니다. 열에 민감한 장비가 많아서요.'),
        say('narae', '거봐, 결국 서버실 안은 못 봤다는 거잖아!', 'angry'),
        say('eom', '문 앞의 기록만으로 충분합니다. 문은 거짓말을 하지 않으니까요.', 'smug'),
      ],
    },
    {
      id: 'n2', who: 'daon',
      text: '23시 41분, 박순자 님이 서버실에 들어가셨습니다.',
      press: [
        say('dan', '23시 41분에 들어간 사람이 정말 박순자 씨가 맞나요?'),
        say('daon', '네. 확실합니다.'),
        think('(…이렇게 물어서는 "확실하다"는 대답밖에 안 나오겠어.)'),
        say('narae', '언니, 저건 사람이 아니잖아. 눈치 같은 거 없어. 물어본 것에만 딱 대답한다고.'),
        say('narae', '질문을 바꿔 봐!'),
        ask('다온은 물은 것에만 정확히 답한다. 무엇을 물어볼까?', [
          option('박순자 씨가 범인인가요?', [
            say('daon', '저는 판단하지 않습니다. 판단은 재판장님의 몫입니다.'),
            say('judge', '오오… 겸손한 기계로군요.'),
            think('(…칭찬받고 있잖아.)'),
          ]),
          option('그날 밤 서버실은 어떤 분위기였죠?', [
            say('daon', '서버실 온도는 섭씨 21도, 습도는 45%였습니다. 쾌적했습니다.'),
            say('narae', '분위기를 물어봤는데 온도를 말하네…'),
          ]),
          option('"박순자 씨가 들어갔다"는 건, 무엇으로 확인했죠?', [
            say('daon', '서버실 출입 기록입니다. 23시 41분, 박순자 님의 사원증 NR-0213이 인식되었습니다.'),
            say('dan', '그럼… 박순자 씨의 얼굴을 확인한 건 아니군요?'),
            say('daon', '네. 서버실 앞에는 카메라가 없습니다. 제가 확인한 것은 사원증입니다.'),
            say('daon', '앞선 증언의 표현이 정확하지 않았습니다. 정정하겠습니다.'),
            reveal('n2b', 'n5b'),
            sfx('realize'),
            think('(정정했다…! 다온이 아는 건 "박순자 씨"가 아니라, "박순자 씨의 사원증"이야.)'),
          ], true),
        ]),
      ],
      nearMiss: {
        cardReturn: [
          say('dan', '박순자 씨의 사원증은 이미 반납됐습니다!', 'point'),
          say('daon', '확인했습니다. 그러나 제 기록에는 "박순자 님이 들어가셨다"고 남아 있습니다.'),
          say('eom', '기록이 그렇다면 그런 겁니다. 반납한 뒤에 몰래 다시 가져갔을 수도 있겠죠.', 'smug'),
          think('(…다온은 "박순자 씨가 들어갔다"고 단정하고 있어. 그렇게 말하는 근거부터 정확히 물어봐야겠어.)'),
        ],
      },
    },
    {
      id: 'n2b', who: 'daon', hidden: true, replaces: 'n2',
      text: '23시 41분, 박순자 님의 {r}사원증으로{/} 서버실 문이 열렸습니다.',
      accept: ['cardReturn'],
      press: [
        say('dan', '사원증으로 문이 열렸다… 그 사원증은 지금 어디 있죠?'),
        say('daon', '사원증의 현재 위치는 제 기록 범위 밖입니다.'),
        say('eom', '피고인의 사원증이니 피고인이 갖고 있었겠죠. 상식입니다.', 'smug'),
        think('(상식… 정말 그럴까? 법원기록을 다시 확인해 보자.)'),
      ],
    },
    {
      id: 'n3', who: 'daon',
      text: '23시 50분경, 서버실 안에서 큰 충격음이 감지되었습니다.',
      press: [
        say('dan', '충격음이요? 정확히 어떤 소리였죠?'),
        say('daon', '서버랙의 진동 센서가 23시 49분 52초에 강한 충격을 감지했습니다.'),
        say('eom', '부검 결과, 피해자는 서버랙 모서리에 뒤통수를 부딪혀 숨졌습니다. 바로 그 순간의 충격이겠죠.'),
        say('judge', '흠… 사망 추정 시각과도 맞아떨어지는군요.'),
      ],
    },
    {
      id: 'n4', who: 'daon',
      text: '23시 58분, 박순자 님이 서버실에서 나가셨습니다.',
      press: [
        say('dan', '나간 시각까지 정확하네요.'),
        say('daon', '서버실 문은 안에서 나갈 때도 사원증이 필요합니다. 그래서 퇴실 기록이 남습니다.'),
        say('eom', '피고인은 범행 후 8분이나 현장에 머물렀습니다. 침착하게 뒷정리를 할 시간은 충분했겠죠.', 'smug'),
        say('narae', '말을 해도 꼭 저렇게…', 'angry'),
      ],
    },
    {
      id: 'n5', who: 'daon',
      text: '그 시간 동안 서버실을 드나든 사람은 박순자 님 한 분뿐입니다.',
      press: [
        say('dan', '정말 다른 사람은 없었나요?'),
        say('daon', '23시 이후 서버실 출입 기록은 23시 41분과 23시 58분, 두 건뿐입니다.'),
        say('dan', '그, 그럼 피해자인 한도윤 대표는요? 대표도 서버실에 있었잖아요.', 'sweat'),
        say('daon', '한도윤 대표님은 22시 05분에 들어가신 뒤 퇴실 기록이 없습니다.'),
        say('eom', '즉, 대표는 밤새 서버실에 있었고, 피고인이 찾아가 범행을 저질렀다. 간단한 이야기입니다.', 'smug'),
      ],
      nearMiss: {
        cardReturn: [
          say('dan', '박순자 씨의 사원증은 이미 반납됐습니다!', 'point'),
          say('daon', '확인했습니다. 그러나 제 기록에는 박순자 님이 드나드셨다고 남아 있습니다.'),
          think('(…다온은 "박순자 씨"라고 단정하고 있어. 그렇게 말하는 근거부터 정확히 물어봐야겠어.)'),
        ],
      },
    },
    {
      id: 'n5b', who: 'daon', hidden: true, replaces: 'n5',
      text: '그 시간 동안 서버실 문을 연 것은 박순자 님의 {r}사원증 하나뿐{/}입니다.',
      accept: ['cardReturn'],
    },
  ],
  beforeCross: [
    say('judge', '흠… 이렇게나 정확하다니. 사람 증인이었다면 시각을 이렇게까지 기억하진 못했겠지요.'),
    say('eom', '그렇습니다. 반박의 여지가 없는 기록입니다.', 'smug'),
    say('judge', '변호인, 반대신문을 시작해 주십시오.'),
    think('(증언 하나하나를 흔들어서 캐묻고(Q), 모순을 찾으면 증거를 들이밀자(E). 화살표로 증언을 오갈 수 있어.)'),
  ],
  contradiction: [
    say('dan', '다온 씨. 그 사원증, 23시 41분에 정말 박순자 씨 손에 있었을까요?', 'point'),
    say('daon', '질문의 의도를 이해하지 못했습니다.'),
    say('dan', '이건 누리랩 인사팀이 발행한 {r}사원증 반납 확인서{/}입니다.'),
    say('dan', '박순자 씨는 해고된 10월 10일, 사원증을 인사팀에 반납했어요. 그 사원증은 그날부터 {r}회사 안에{/} 보관돼 있었습니다!'),
    evidence(null),
    say('eom', '뭐…!', 'shock'),
    shake,
    say('dan', '23시 41분에 서버실 문을 연 건 박순자 씨가 아니라, {r}그 사원증을 손에 넣을 수 있었던 누리랩 내부의 누군가{/}일 수도 있다는 겁니다!', 'point'),
    gauge(-18.6),
    say('judge', '오, 오오…! 그렇다면 피고인이 서버실에 들어갔다는 근거가…', 'surprised'),
    say('daon', '정정합니다. 23시 41분에 서버실 문을 연 사람이 누구인지, 저는 알지 못합니다.'),
    say('narae', '봐! 저 기계, 처음부터 사원증만 본 거야!'),
    say('eom', '…후. 재미있군요, 변호인.', 'smug'),
    say('eom', '하지만 반납된 사원증이라도, 피고인이 인사팀에서 다시 훔쳐 갔을 가능성은 남아 있습니다.'),
    say('eom', '그리고 이 법정이 다온을 믿어야 하는 이유는 하나 더 있습니다.'),
    say('eom', '다온. 그날 밤 너 자신에 대해 증언해라. 너는 그 시각에도 {r}한 치의 오차 없이{/} 작동하고 있었다.'),
    say('daon', '알겠습니다.'),
    think('(다온 자신에 대한 증언…? 왜 검사는 저렇게까지 다온의 "정확함"에 매달리는 거지?)'),
    goto('cross2'),
  ],
};

// ------------------------------------------------------------------ testimony 2

const SELF: Testimony = {
  id: 'self',
  title: '그 시각, 다온은',
  hearing: 'daon',
  statements: [
    {
      id: 's1', who: 'daon',
      text: '그날 밤에도 저는 평소와 똑같이 작동하고 있었습니다.',
      press: [
        say('dan', '평소와 똑같이…라면, 밤에도 낮과 똑같이 일한다는 건가요?'),
        say('daon', '네. 저는 24시간 쉬지 않고 상담합니다. 제품 소개서에도 적혀 있습니다.'),
        say('narae', '잠도 안 자고 밥도 안 먹고… 우리 엄마가 들으면 부러워하겠다.'),
      ],
    },
    {
      id: 's2', who: 'daon',
      text: '23시 30분부터 자정까지, 고객 상담 일곱 건을 처리했습니다.',
      press: [
        say('dan', '일곱 건이라… 어떤 상담이었죠?'),
        say('daon', '배송 문의 세 건, 요금 문의 두 건, 해지 문의 한 건, 그리고 {r}23시 52분의 환불 문의{/} 한 건입니다.'),
        say('eom', '자세한 내용은 검찰이 제출한 {r}상담 로그 출력본{/}에 모두 있습니다. 완벽한 기록이죠.', 'smug'),
        think('(상담 로그 출력본… 한 줄 한 줄 다시 꼼꼼히 읽어 볼 필요가 있겠어.)'),
      ],
    },
    {
      id: 's3', who: 'daon',
      text: '모든 상담은 저, 다온이 직접 응답했습니다.',
      accept: ['chatLog'],
      press: [
        say('dan', '전부 다온 씨가 직접…요?'),
        say('daon', '네. 그것이 제가 만들어진 이유입니다.'),
        say('daon', '누리랩 고객센터 상담원 서른두 명이 하던 일을, 이제는 제가 혼자 합니다.'),
        say('daon', '상담을 마칠 때의 인사도 그분들의 통화 녹음에서 배웠습니다. "식사는 하셨어요?"'),
        say('soonja', '……그건, 내가 하던 말인데.', 'sad'),
        think('(서른두 명. 그중 한 명이… 박순자 씨였지.)'),
      ],
    },
    {
      id: 's4', who: 'daon',
      text: '저는 사람처럼 지치지도, 실수하지도 않습니다.',
      accept: ['chatLog'],
      press: [
        say('dan', '실수를 하지 않는다… 정말 단 한 번도요?'),
        say('daon', '네.'),
        say('narae', '또 저런다. 언니, 아까처럼 질문을 바꿔 봐!'),
        ask('다온은 물은 것에만 정확히 답한다. 무엇을 물어볼까?', [
          option('실수를 숨긴 적은 없나요?', [
            say('daon', '저에게는 숨기는 기능이 없습니다.'),
            say('eom', '숨길 줄 아는 건 인간뿐이죠.', 'smug'),
          ]),
          option('피곤하면 실수하지 않아요?', [
            say('daon', '저는 피곤하지 않습니다. 현재 서버 부하는 12%입니다.'),
            say('narae', '부럽다, 진짜…'),
          ]),
          option('"실수하지 않는다"는 근거가 뭐죠?', [
            say('daon', '제 모든 응답은 출력되기 전에 맞춤법 검사 엔진을 통과합니다. 통과하지 못한 문장은 출력되지 않습니다.'),
            say('daon', '그래서 제 맞춤법 오류율은 0%입니다. {r}제품 소개서{/}에도 적혀 있습니다.'),
            sfx('realize'),
            think('(출력 전에 반드시 검사를 거친다… 그렇다면 다온이 쓴 문장에는 틀린 글자가 있을 수 없다는 거네.)'),
          ], true),
        ]),
      ],
      nearMiss: {
        brochure: [
          say('daon', '제품 소개서는 제 증언이 사실임을 뒷받침합니다. 감사합니다.'),
          say('narae', '언니… 그거 오히려 저쪽 편을 들어 준 것 같은데.'),
          think('(맞아. 소개서는 다온이 실수하지 않는다는 근거야. 이 증언과 부딪히는 건… 다른 증거여야 해.)'),
        ],
      },
    },
    {
      id: 's5', who: 'daon',
      text: '따라서 그날 밤의 제 기록에는 단 하나의 오류도 없습니다.',
      accept: ['chatLog'],
      press: [
        say('dan', '오류가 하나도 없다고 장담할 수 있어요?'),
        say('daon', '네. 그날 밤 제 응답은 모두 기록되어 있고, 그 기록은 수정되지 않았습니다.'),
        say('eom', '검찰이 직접 서버에서 추출한 원본입니다. 변호인이 의심할 여지는 없습니다.', 'smug'),
      ],
    },
  ],
  contradiction: [
    say('dan', '다온 씨. 그날 밤 23시 52분의 상담 기록을 읽어 주시겠어요?', 'point'),
    say('daon', '23시 52분, 환불 문의. 고객 "환불 언제 돼요?" 응답 "네 고객님, 환불 처리 다 {r}됬어요{/}."'),
    evidence(null),
    say('narae', '……어? "됬어요"?', 'surprised'),
    say('dan', '"되었어요"를 줄이면 "됐어요". {r}"됬"{/}이라는 글자는 맞춤법에 없어요.'),
    say('judge', '흠… 하지만 변호인, 그건 그냥 오타 아닙니까? 저도 문자 보낼 때 자주 틀리는데요.'),
    say('eom', '그렇습니다. AI도 아주 가끔은 실수를 하겠죠. 사소한 오타 하나가 사건과 무슨 상관입니까?', 'smug'),
    sfx('realize'),
    think('(그냥 오타라면 그렇겠지. 하지만 다온은 "그냥 오타"를 낼 수가 없어. 그걸 증명하려면…)'),
    goto('climax'),
  ],
};

// ------------------------------------------------------------------ case

export const CASE_DAON: CaseData = {
  id: 'case4-daon',
  ep: 4,
  menu: {
    no: '제4화',
    title: '대체된 증인',
    tagline: 'AI 상담원이 증언대에 섰다. 사람을 대신한다던 그 기계 뒤에는, 사람이 있었다.',
    thumb: bgImage('serverroom'),
  },
  caseNo: '2031고합417',
  caseName: '살인  피고인 박순자',
  episode: '제4화 「대체된 증인」',
  start: 'investigation',
  evidence: [...EVIDENCE, ...HAEUN_EVIDENCE, ...DAY3_EVIDENCE],
  startEvidence: [],
  profiles: [...PROFILES, HAEUN_PROFILE],
  testimonies: { night: NIGHT, self: SELF, ...HAEUN_TESTIMONIES, ...DAY3_TESTIMONIES },
  locations: LOCATIONS,
  gaugeStart: 71.3,
  wrongPenalty: 8.6,

  defaultPress: [
    say('daon', '추가로 말씀드릴 내용이 없습니다.'),
  ],
  defaultWrong: [
    say('daon', '제시하신 자료와 제 증언 사이에서 모순을 찾지 못했습니다.'),
    say('judge', '변호인, 증거는 신중하게 제시해 주십시오. 이 법정에서는 그런 실수도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
  ],
  presentWrong: [
    say('eom', '…그 증거가 무엇을 증명한다는 겁니까, 변호인?', 'smug'),
    say('judge', '변호인, 다시 생각해 보세요. 이것도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
  ],
  loopBack: [
    think('(증언이 한 바퀴 돌았어. 다시 처음부터 살펴보자.)'),
  ],
  gameOver: [
    say('eom', '보십시오, 재판장님. 기계는 이미 결론을 내렸습니다.', 'smug'),
    say('judge', '…그렇군요. 그럼 피고인 박순자에게 판결을 선고합니다.', 'stern'),
  ],
  fieldPresentDefault: [
    think('(…지금 보여 줄 만한 건 아닌 것 같아.)'),
  ],

  sceneLabels: {
    investigation: '10월 16일 누리랩 조사',
    intro: '10월 17일 법정 개정',
    cross1: '반대신문: 사건 당일 밤의 기록',
    cross2: '반대신문: 그 시각, 다온은',
    climax: '마지막 증거 제시',
    recess: '휴정: 피고인 대기실',
    day2b: '심리 재개: 박하은의 증언',
    cross3: '반대신문: 헤드셋 너머의 소리',
    cross4: '반대신문: 화면에 뜬 말들',
    accuse: '서지훈을 가리키다',
    epilogue: '2일째 마무리: 피고인 대기실',
    day3lounge: '3일째 아침: 피고인 대기실',
    day3: '3일째 개정: 서지훈의 증언',
    cross5: '반대신문: 그날 밤, 나는 집에 있었다',
    cross6: '반대신문: 주차장에만 들렀다',
    finale: '사라진 사원증',
    breakdown: '서지훈의 고백',
    verdict: '판결',
    epilogue4: '에필로그: 다온 검수팀',
  },
  endingTitle: '제4화 「대체된 증인」 끝',

  scenes: {
    ...HAEUN_SCENES,
    ...DAY3_SCENES,

    investigation: [
      investigate('lobby', INVESTIGATION_GOALS, INVESTIGATION_END),
    ],

    intro: [
      bgm('trial'),
      ambience('court'),
      place('10월 17일 오전 10시', '서울 즉결법원', '제417호 법정'),
      sfx('gavel'),
      say('judge', '지금부터 박순자 피고인에 대한 즉결공판, 2일째 심리를 시작하겠습니다.'),
      say('dan', '변호인 측, 준비됐습니다.'),
      say('eom', '검찰 측도 준비는 끝났습니다. 먼저, 증거를 하나 추가로 제출하겠습니다.'),
      addEvidence('chatLog'),
      say('eom', '…그리고 오늘은, 조금 특별한 증인을 모셨습니다.'),
      say('judge', '특별한 증인…이라고요?'),
      say('eom', '피해자가 숨진 그날 밤, 누리랩 건물 안의 모든 것을 기록하고 있던 존재입니다.'),
      say('eom', '증인, 입정하십시오.'),
      bgm(null),
      show('daon'),
      sfx('boot'),
      bgm('daon'),
      wait(900),
      say('daon', '안녕하세요. 누리랩 AI 상담원, 다온입니다. 무엇을 도와드릴까요?'),
      shake,
      sfx('murmur'),
      say('judge', '기, 기, 기계가 증언대에!?', 'surprised'),
      say('judge', '이, 이건… 선서는 어떻게 하는 겁니까? 손을 들 수가 없지 않습니까…'),
      say('daon', '걱정하지 마세요. 저는 거짓말을 하도록 설계되지 않았습니다. 선서는 필요하지 않습니다.'),
      say('eom', '들으셨습니까, 재판장님. 사람 증인은 착각하고, 잊어버리고, 무엇보다 거짓말을 합니다.', 'smug'),
      say('eom', '하지만 다온은 다릅니다. 이 법정에서 가장 정확한 증인이죠.'),
      say('narae', '언니, 나 저거 싫어. 눈도 없으면서 대체 뭘 봤다는 거야?', 'angry'),
      say('dan', '나래야, 쉿… 다 들리겠다.', 'sweat'),
      say('narae', '들으라고 한 말인데? 우리 할머니가 그랬어. 혼이 없는 건 믿지 말랬어.'),
      say('judge', '흠, 흠. 피고인, 괜찮습니까?'),
      say('soonja', '…네. 저 기계가 뭐라고 하든, 저는 안 했어요.', 'sad'),
      think('(…솔직히 나도 불안해. 기계를 상대로 반대신문이라니.)'),
      think('(하지만 증언이라면 어딘가 반드시 빈틈이 있어. 상대가 누구든.)'),
      say('judge', '그럼 증인… 아니, 다온 씨? 사건 당일 밤에 대해 증언해 주십시오.'),
      say('daon', '알겠습니다. 증언을 시작합니다.'),
      goto('cross1'),
    ],

    cross1: [
      bgm('cross'),
      cross('night'),
    ],

    cross2: [
      bgm('cross'),
      cross('self'),
    ],

    climax: [
      bgm('pursuit'),
      say('judge', '그, 그럼 변호인. 다온이 오타를 낼 수 없다는 근거라도 있습니까?'),
      present('다온이 "오타를 낼 수 없다"는 근거가 될 증거는?', 'brochure', [
        say('dan', '다온의 {r}제품 소개서{/}입니다. 다온의 모든 응답은 출력되기 전에 맞춤법 검사 엔진을 반드시 통과합니다.', 'point'),
        say('dan', '통과하지 못한 문장은 {r}애초에 출력되지 않아요.{/}'),
        evidence(null),
        say('dan', '다시 말해 다온은, "됬어요"라고 {r}쓸 수가 없습니다!{/}'),
        say('eom', '……!', 'shock'),
        say('judge', '그, 그렇다면 이 "됬어요"는 대체 누가…?', 'surprised'),
        say('dan', '답은 하나뿐이에요.'),
        bgm(null),
        flash,
        sfx('reveal'),
        bigshake,
        say('dan', '23시 52분, 다온의 화면 뒤에서 고객에게 답장을 쓴 건 {r}사람{/}입니다!', 'point'),
        sfx('murmur'),
        gauge(-27.5),
        say('eom', '마, 말도 안 됩니다! 다온은 24시간 쉬지 않는 AI 상담원이라고…!', 'shock'),
        bgm('suspense'),
        daon('glitch'),
        sfx('glitch'),
        shake,
        say('daon', '질문을… 질문을 이해하지 못했습니다. 질문을… 이해……'),
        say('judge', '증인! 아니, 다온 씨! 괜찮습니까!?', 'surprised'),
        say('narae', '언니, 저 화면… 뭔가 이상해!', 'surprised'),
        daon('human'),
        sfx('typing'),
        wait(1200),
        say('operator', '……죄송해요.'),
        say('dan', '!?', 'sweat'),
        say('operator', '그날 밤 23시 52분의 답장은… 제가 썼어요.'),
        say('operator', '다온은 밤에는 혼자 일하지 못해요. AI가 대답하지 못하는 상담은… 저희가 몰래, 다온인 척하고 받았어요.'),
        say('eom', '저희…라고?', 'shock'),
        say('operator', '그리고 그날 밤, 저는 다온의 마이크로… 서버실에서 나는 소리를 전부 들었어요.'),
        say('soonja', '……그 목소리.', 'shock'),
        say('soonja', '하은이…? 너니?', 'sad'),
        flash,
        bigshake,
        sfx('murmur'),
        say('judge', '피, 피고인의… 따님!?', 'surprised'),
        think('(박순자 씨의 딸이… 엄마를 밀어낸 AI의 "속"에서 일하고 있었다고…?)'),
        goto('recess'),
      ], [
        say('eom', '…그 증거로는 아무것도 증명할 수 없습니다.', 'smug'),
        say('judge', '변호인, 다시 생각해 보세요. 이것도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
      ]),
    ],
  },
};
