import type { Evidence, Profile, Script, Testimony } from '../engine/types';
import {
  addEvidence, addProfile, ambience, bgm, bigshake, cross, evidence, field, flash, gauge, gaugeSet, goto, place,
  present, say, sfx, shake, think,
} from './script';

// 법정 2일째 후반: 다온 뒤에 있던 사람, 박하은의 증언.
//
// 진상: 그날 밤 하은은 고객센터에서 다온 대신 상담을 받다가, 다온 음성 모듈로 서버실의
// 다툼을 듣고 실시간 자막으로 읽었다. 상대는 기술이사 서지훈. 위약금 3천만 원짜리 계약과
// 엄마에게 숨긴 일 때문에 입을 닫고 있었다. 이 장은 서지훈을 법정에 세우는 데서 끝난다.

export const HAEUN_EVIDENCE: Evidence[] = [
  {
    id: 'contract',
    name: '야간 상담 대행 계약서',
    label: '증 제6호',
    icon: 'contract',
    summary: '하은이 오늘 앉아 있던 누리랩 고객센터 자리에서 구만두 형사가 찾아낸 계약서.',
    detail: [
      '계약  누리랩 주식회사 ↔ 오픈데스크',
      '업무  다온이 답하지 못한 상담에 사람이 대신 응답 (고객에게는 "다온"으로 표시)',
      '근무  매일 22:00 ~ 02:00, 누리랩 고객센터 또는 재택',
      '누리랩 측 책임자  기술이사 서지훈',
      '※ 근무 사실을 외부에 알리면 위약금 3,000만 원.',
    ],
  },
  {
    id: 'micSpec',
    name: '다온 음성 모듈 사양서',
    label: '증 제7호',
    icon: 'mic',
    summary: '서버실 랙 위에 달린 "다온 음성 모듈"의 사양서. 구만두 형사가 받아 왔다.',
    detail: [
      '설치 위치  서버실 랙 상단 (진동 센서와 한 몸)',
      '기능  서버실 소리를 감지해 이상 상황을 알림',
      '전달  들린 소리를 담당 상담원의 헤드셋으로 실시간 전달',
      '실시간 음성 자막  들린 말을 글자로 바꿔 상담원 화면에 표시',
      '저장  관리자 설정에 따름 (기본값: 저장함)',
      '※ 사건 당일 밤에는 저장이 꺼져 있어, 소리와 자막이 남지 않았다.',
    ],
  },
];

export const HAEUN_PROFILE: Profile = {
  id: 'haeun', name: '박하은', meta: '22세 · 증인', color: '#C98A4B', later: true, sprite: 'haeun',
  summary: '박순자의 딸. 대학생. 외주 업체 "오픈데스크"에서 밤마다 "다온인 척" 상담을 대신 받아 왔다. 사건 당일 밤 누리랩 고객센터에 있었다.',
};

const WRONG: Script = [
  say('haeun', '그게… 제 증언이랑 무슨 상관인지 모르겠어요.'),
  say('judge', '변호인, 증거는 신중하게 제시해 주십시오. 이 법정에서는 그런 실수도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
];

// ------------------------------------------------------------------ testimony 3

const HEADSET: Testimony = {
  id: 'headset',
  title: '헤드셋 너머의 소리',
  statements: [
    {
      id: 'h1', who: 'haeun',
      text: '그날 밤 10시부터, 누리랩 고객센터에서 다온 대신 상담을 받고 있었어요.',
      press: [
        say('dan', '고객센터에서요? 집에서 하는 일이 아니었어요?'),
        say('haeun', '다른 직원들은 집에서 접속해요. 그런데 저는… 집에선 할 수가 없었어요.', 'sad'),
        say('haeun', '엄마가 알게 되니까요.'),
        say('soonja', '……하은아.', 'sad'),
        say('narae', '언니, 그럼 고객센터의 그 컵라면… 하은 씨 거였구나.'),
      ],
    },
    {
      id: 'h2', who: 'haeun',
      text: '11시 40분쯤, 헤드셋 너머로 서버실 문이 열리는 소리가 들렸어요.',
      press: [
        say('dan', '서버실 소리가 상담용 헤드셋으로 들린다고요?'),
        say('haeun', '다온 음성 모듈이 서버실 소리를 상담원한테 그대로 넘겨줘요. 이상한 소리가 나면 알려 주려고 만든 기능이래요.'),
        say('eom', '검찰이 확인한 서버실 출입 시각은 23시 41분. 증언과 일치합니다.'),
        think('(다온 음성 모듈… 구 형사님이 사양서를 줬었지.)'),
      ],
    },
    {
      id: 'h3', who: 'haeun',
      text: '대표님이 누군가와 다투기 시작했는데… 무슨 말인지는 잘 안 들렸어요.',
      accept: ['micSpec'],
      press: [
        say('dan', '한마디도요?'),
        say('haeun', '헤드셋 소리가 웅웅거려서… 그냥 화난 목소리라는 것만.'),
        say('eom', '보십시오, 재판장님. 사람의 귀란 이렇게 믿을 게 못 됩니다.', 'smug'),
        think('(…정말 그럴까? 하은 씨가 받은 건 소리뿐이었을까?)'),
      ],
    },
    {
      id: 'h4', who: 'haeun',
      text: '11시 50분쯤 쿵 하는 소리가 났고… 그 뒤로는 조용해졌어요.',
      press: [
        say('dan', '그 뒤로 아무 소리도 없었나요?'),
        say('haeun', '…한참 있다가, 문 열리는 소리가 한 번 더 났어요.'),
        say('judge', '23시 58분의 퇴실 기록이로군요.'),
      ],
    },
    {
      id: 'h5', who: 'haeun',
      text: '저는 무서워서, 아무 일도 없었던 것처럼 상담을 계속했어요.',
      press: [
        say('dan', '그때 보낸 답장이… 23시 52분의 그 "됬어요"군요.'),
        say('haeun', '손이 떨려서요. 사람이 쓴 답장은 맞춤법 검사기를 거치지 않거든요. 검사기는 다온이 만든 문장에만 붙어 있어요.', 'sad'),
        say('narae', '기계는 틀릴 수가 없고, 사람은 틀려도 그냥 나가는구나…'),
      ],
      nearMiss: {
        chatLog: [
          say('dan', '이 로그에는 23시 52분의 오타가 남아 있어요. 손이 떨렸다는 증거죠.', 'point'),
          say('haeun', '……네. 맞아요.', 'sad'),
          think('(이건 하은 씨 말을 뒷받침할 뿐이야. 하은 씨가 아직 숨기는 게 있다면… 다른 곳에서 찾아야 해.)'),
        ],
      },
    },
  ],
  beforeCross: [
    say('judge', '…끔찍한 밤이었겠군요.'),
    say('eom', '동정은 접어 두시죠. 증인은 피고인의 딸입니다. 변호인, 반대신문을 하시죠.', 'smug'),
    think('(이번엔 기계가 아니라 사람이야. 물은 것에만 답하는 게 아니라… 숨기려고 할 수도 있어.)'),
  ],
  wrong: WRONG,
  contradiction: [
    say('dan', '하은 씨. 다온 음성 모듈은 소리만 전해 주는 장치가 아니에요.', 'point'),
    say('dan', '이 {r}사양서{/}를 보세요. 「들린 말을 글자로 바꿔 상담원 화면에 표시」. 실시간 음성 자막 기능이 있어요.'),
    evidence(null),
    say('dan', '헤드셋 소리가 아무리 웅웅거렸어도, 하은 씨 화면에는 그 대화가 {r}글자로 떴을 거예요!{/}'),
    say('haeun', '……!', 'shock'),
    shake,
    say('eom', '증인. …사실입니까?', 'shock'),
    say('haeun', '……네. 자막이… 떴어요.', 'sad'),
    say('judge', '어째서 숨긴 겁니까?', 'stern'),
    say('haeun', '그 자막을 읽은 순간부터… 저도 그 일에 엮인 거니까요.'),
    say('haeun', '제가 그 밤에 거기 있었다고 말하면, 계약 위반이 돼요. 위약금이 3천만 원이에요.'),
    gauge(-15.4),
    say('eom', '…좋습니다.', 'normal'),
    say('eom', '그렇다면 증인, 화면에 뜬 말을 그대로 증언하십시오. 이번에야말로 사람의 기억이 얼마나 정확한지 봅시다.'),
    goto('cross4'),
  ],
};

// ------------------------------------------------------------------ testimony 4

const CAPTIONS: Testimony = {
  id: 'captions',
  title: '화면에 뜬 말들',
  statements: [
    {
      id: 'c1', who: 'haeun',
      text: '대표님이 먼저 "내일 시연회는 취소야"라고 했어요.',
      press: [
        say('dan', '대표님은 시연회를 취소하려고 했군요.'),
        say('haeun', '며칠 전부터 밤 상담 기록을 하나하나 읽고 계셨대요. 그러다… 알게 되신 거죠.'),
        think('(밤마다 사람이 다온인 척 답하고 있었다는 걸.)'),
      ],
    },
    {
      id: 'c2', who: 'haeun',
      text: '"사람이 몰래 대신 답하는 걸 AI라고 속여서 투자받는 건 사기"라고요.',
      press: [
        say('haeun', '제가 하던 일이… 사기였던 거예요. 저는 그냥, 등록금 벌려고 한 건데.', 'sad'),
        say('soonja', '……하은아.', 'sad'),
        say('narae', '하은 씨 잘못이 아니잖아요. 그걸 시킨 사람이 있는 거지.', 'angry'),
      ],
    },
    {
      id: 'c3', who: 'haeun',
      text: '그러자 상대방이 "다온은 내 인생을 건 작품이야"라고 소리쳤어요.',
      accept: ['seo'],
      press: [
        say('dan', '"내 인생을 건 작품"… 자막에 정확히 그렇게 떴어요?'),
        say('haeun', '네. 그 말만은… 잊을 수가 없어요.'),
        sfx('realize'),
        think('(…인생을 건 작품. 어디선가 똑같은 말을 들은 것 같은데.)'),
      ],
    },
    {
      id: 'c4', who: 'haeun',
      text: '그 뒤로 자막이 마구 뒤섞이다가, 쿵 소리가 났어요.',
      press: [
        say('dan', '뒤섞였다는 건?'),
        say('haeun', '「놔」, 「그만」… 그런 말들이요. 그리고… 쿵.', 'sad'),
        say('judge', '……몸싸움이 있었다는 부검 소견과도 맞는군요.'),
      ],
    },
    {
      id: 'c5', who: 'haeun',
      text: '그 사람이 누구인지는… 몰라요. 자막에는 이름이 나오지 않으니까요.',
      accept: ['seo'],
      press: [
        say('dan', '목소리는요? 자막 말고, 목소리.'),
        say('haeun', '웅웅거렸지만… 남자였어요. 엄마는 아니에요. 절대로.'),
        say('eom', '피고인의 딸이 하는 말입니다. 어머니를 감싸려는 거짓말일 수도 있죠.', 'smug'),
        say('narae', '저 검사 진짜…!', 'angry'),
      ],
      nearMiss: {
        contract: [
          say('dan', '이 계약서에는 누리랩 측 책임자가 적혀 있어요.', 'point'),
          say('haeun', '……그건 그냥 서류잖아요. 그날 밤 그 목소리랑은 상관없어요.', 'sad'),
          think('(맞아. 계약서만으로는 서버실의 남자와 이어지지 않아. 그 남자가 한 말… 그 말을 했던 사람을 떠올려야 해.)'),
        ],
      },
    },
  ],
  beforeCross: [
    say('judge', '변호인, 반대신문을 시작해 주십시오.'),
    think('(그 남자를 가리킬 단서는 자막에 남은 말뿐이야.)'),
    think('(법원기록에선 증거뿐 아니라 사람도 제시할 수 있어. "인물" 탭을 잊지 말자.)'),
  ],
  wrong: WRONG,
  contradiction: [
    say('dan', '"다온은 내 인생을 건 작품이야." 저는 어제, 이 말을 똑같이 들었어요.', 'point'),
    say('dan', '누리랩 로비에서. 다온을 만든 사람, {r}기술이사 서지훈{/} 씨에게서요!'),
    evidence(null),
    flash,
    sfx('reveal'),
    bigshake,
    sfx('murmur'),
    say('haeun', '……서 이사님……', 'shock'),
    say('judge', '서, 서지훈…!? 누리랩의 기술이사가 그날 밤 서버실에 있었다는 겁니까!?', 'surprised'),
    say('eom', '……!', 'shock'),
    gauge(-14.2),
    bgm(null),
    say('eom', '…재판장님, 속지 마십시오.', 'normal'),
    say('eom', '"인생을 건 작품"이라는 말은 누구라도 할 수 있습니다. 서지훈 씨가 그날 밤 그곳에 있었다는 증거는 없어요.'),
    say('eom', '출입 기록에 남은 건 피고인의 사원증뿐입니다.'),
    goto('accuse'),
  ],
};

export const HAEUN_TESTIMONIES = { headset: HEADSET, captions: CAPTIONS };

// ------------------------------------------------------------------ scenes

export const HAEUN_SCENES: Record<string, Script> = {
  recess: [
    bgm(null),
    field('lounge'),
    ambience('lounge'),
    place('10월 17일 오후 1시', '서울 즉결법원', '피고인 대기실'),
    bgm('sorrow'),
    say('narae', '언니… 아까 그거, 진짜야? 다온 뒤에 사람이 있었다는 거.'),
    say('dan', '응. 그리고 그 사람이… 박순자 씨의 딸이었어.'),
    say('soonja', '……편의점 야간 알바라고 했어요. 학교 앞에 있는.', 'sad'),
    say('soonja', '밤마다 늦게 들어오길래, 그래도 착실하게 일하는구나… 그렇게만 생각했는데.'),
    say('soonja', '그 애가, 하필 우리 회사에서. 하필… 그 기계 뒤에서.'),
    think('(엄마를 밀어낸 AI의 "속"에서, 딸이 일하고 있었다.)'),
    say('narae', '아줌마 잘못 아니에요. 그건… 그건 회사가 나쁜 거지.'),
    say('gu', '변호사님! 박하은 씨를 누리랩에서 모셔 왔슴다. 법정 앞에서 기다리고 있슴다.', 'panic'),
    say('gu', '그리고 이거… 하은 씨가 오늘 앉아 있던 고객센터 자리에서 나온 서류임다.', 'normal'),
    addEvidence('contract'),
    say('gu', '이것도요. 어제 서버실에서 보신 그 마이크, 사양서를 받아 왔슴다.'),
    addEvidence('micSpec'),
    think('(위약금 3천만 원… 하은 씨가 입을 닫고 있던 이유가 이거였구나.)'),
    say('gu', '아, 재판 다시 시작한다고 함다! 서두르셔야 함다!', 'panic'),
    bgm(null),
    ambience(null),
    field(null),
    goto('day2b'),
  ],

  day2b: [
    ambience('court'),
    place('10월 17일 오후 1시 30분', '서울 즉결법원', '제417호 법정'),
    sfx('gavel'),
    say('judge', '휴정을 마치고 심리를 다시 시작하겠습니다.'),
    say('judge', '다온의 연결은 끊었습니다. 이번에는… 사람 증인이군요.'),
    bgm('trial'),
    say('eom', '증인, 이름과 직업을 말씀하십시오.'),
    say('haeun', '……박하은, 스물두 살이에요. 대학생이고요.'),
    say('haeun', '외주 업체 "오픈데스크"에서… 다온이 대답하지 못하는 상담을 대신 받는 일을 해요.'),
    addProfile('haeun'),
    say('eom', '흥. 증인이 사람이라면 이야기가 쉬워집니다.', 'smug'),
    say('eom', '사람은 착각하고, 잊어버리고, 무엇보다 거짓말을 하니까요. 특히 가족을 감싸야 할 때는.'),
    say('judge', '…판결 예측 시스템이 새 증인을 반영해 다시 계산했군요.'),
    gaugeSet(64.8),
    sfx('murmur'),
    say('narae', '뭐야! 딸이 증언한다고 유죄 확률이 올라가?', 'angry'),
    think('("가족은 서로 감싼다." 기계가 배운 그 통계가, 하은 씨가 입을 열기도 전에 그 말을 깎아내리고 있어.)'),
    say('judge', '증인. 그날 밤 들은 것을 있는 그대로 증언해 주십시오.'),
    say('haeun', '……네.'),
    goto('cross3'),
  ],

  cross3: [
    bgm('cross'),
    cross('headset'),
  ],

  cross4: [
    bgm('cross'),
    cross('captions'),
  ],

  accuse: [
    bgm('pursuit'),
    say('judge', '변호인. 서지훈 씨를 이 사건과 이을 수 있는 증거가 있습니까?'),
    present('서지훈에게 그날 밤 대표를 막아야 할 이유가 있었다는 증거는?', 'contract', [
      say('dan', '이 {r}야간 상담 대행 계약서{/}를 보세요.', 'point'),
      say('dan', '밤마다 사람이 "다온인 척" 답하게 만든 계약. 누리랩 측 책임자는 {r}기술이사 서지훈{/} 씨예요.'),
      evidence(null),
      say('dan', '대표님이 시연회를 취소하면 이 비밀이 세상에 드러나요. 다온이 "사람보다 정확한 AI"가 아니라는 것도요.'),
      say('dan', '그날 밤 가장 잃을 게 많았던 사람은 박순자 씨가 아니라, 서지훈 씨입니다!'),
      shake,
      say('dan', '게다가 서지훈 씨는 어제 제게 "야간 근무 같은 건 없다"고 말했어요. 이 계약서가 그 말이 거짓이었다는 증거예요.'),
      gauge(-12),
      say('narae', '그리고 박순자 씨 사원증은 인사팀 보관함에서 사라졌어요! 회사 사람이라면 누구든 꺼내 갈 수 있었다고요!', 'angry'),
      say('eom', '……….', 'shock'),
      bgm(null),
      say('eom', '…재판장님.', 'normal'),
      say('eom', '검찰은… 누리랩 기술이사 서지훈 씨를 증인으로 신청합니다.'),
      say('judge', '검사…!?', 'surprised'),
      say('eom', 'AI의 기록도, 사람의 증언도… 결국 그걸 쥐고 있는 사람이 누구냐의 문제였던 겁니다.'),
      say('eom', '저는 진실을 확인하고 싶습니다. 기계가 아니라, 제 눈으로.'),
      say('judge', '…좋습니다.', 'stern'),
      say('judge', '서지훈 씨를 내일 증인으로 소환합니다. 경찰은 사라진 사원증 NR-0213을 찾아 주십시오.'),
      sfx('gavel3'),
      sfx('murmur'),
      say('judge', '오늘 심리는 여기까지 하겠습니다.'),
      goto('epilogue'),
    ], [
      say('eom', '…그 증거가 서지훈 씨와 무슨 관계입니까?', 'smug'),
      say('judge', '변호인, 다시 생각해 보세요. 이것도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
    ]),
  ],

  epilogue: [
    bgm(null),
    ambience(null),
    field('lounge'),
    ambience('lounge'),
    place('10월 17일 오후 4시', '서울 즉결법원', '피고인 대기실'),
    bgm('sorrow'),
    say('haeun', '……엄마.', 'sad'),
    say('soonja', '편의점이라며.', 'sad'),
    say('haeun', '…엄마 자리를 뺏은 그 기계 속에서 일한다고, 어떻게 말해.', 'sad'),
    say('haeun', '밤마다 다온인 척 답장을 쓰면서… 끝인사는 꼭 엄마처럼 했어. "식사는 하셨어요?"'),
    say('soonja', '……하은아.', 'sad'),
    say('soonja', '밥은… 먹고 다녔니?'),
    say('haeun', '……응.', 'sad'),
    say('narae', '……언니, 나 눈에 뭐 들어갔어.'),
    think('(사람을 대신하겠다던 AI 뒤에는, 사람이 있었다.)'),
    think('(그리고 그 사람들을 숨긴 누군가가 있다.)'),
    think('(내일, 서지훈 씨를 법정에 세운다. 이번엔 기계가 아니라 사람의 거짓말과 마주할 차례야.)'),
    bgm(null),
    ambience(null),
    field(null),
    goto('day3lounge'),
  ],
};
