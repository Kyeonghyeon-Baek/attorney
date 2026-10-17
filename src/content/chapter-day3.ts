import type { Evidence, Script, Testimony } from '../engine/types';
import {
  addEvidence, ambience, ask, bgm, bigshake, cross, daon, end, evidence, field, gauge, gaugeSet, goto,
  option, place, present, redflash, say, sfx, shake, show, think, verdict, wait, zoom,
} from './script';

// 법정 3일째: 서지훈 신문, 진범 붕괴, 판결, 에필로그.
//
// 진상: 서지훈은 그날 밤 회사에 남아 있었다. 23:40 5층 내부망에서 다온의 "음성 자막 저장"을
// 끄고, 23:41 인사팀 보관함에서 꺼낸 박순자의 사원증으로 서버실에 들어갔다. 시연회를 취소하겠다는
// 대표와 다투다 밀쳤고, 23:58 같은 사원증으로 나와 0:07 차를 타고 떠났다. 보관함이 있는
// 고객센터엔 하은이 있었기 때문에 사원증을 돌려놓지 못하고 차에 싣고 갔다.

export const DAY3_EVIDENCE: Evidence[] = [
  {
    id: 'parking',
    name: '누리랩 주차장 출차 기록',
    label: '증 제8호',
    icon: 'log',
    summary: '구만두 형사가 밤새 찾아낸 누리랩 지하 주차장의 차량번호 인식 기록.',
    detail: [
      '10월 14일 21:52  입차  12가 3456 (등록: 기술이사 서지훈)',
      '10월 15일 00:07  출차  12가 3456',
      '※ 차량번호 인식 카메라 기록. 운전한 사람의 얼굴은 찍히지 않는다.',
    ],
  },
  {
    id: 'settingsLog',
    name: '다온 설정 변경 기록',
    label: '증 제9호',
    icon: 'log',
    summary: '법정에 다시 연결된 다온이 내놓은 기록.',
    detail: [
      '10월 14일 23:40',
      '변경  음성 자막 저장: 켜짐 → 꺼짐',
      '계정  관리자 seo.jihun',
      '접속 위치  누리랩 5층 내부망 (서버실·고객센터가 있는 층)',
      '※ 내부망은 건물 안에서만 접속할 수 있다.',
    ],
  },
  {
    id: 'badge',
    name: '사원증 NR-0213',
    label: '증 제10호',
    icon: 'card',
    summary: '서지훈의 차 트렁크, 노트북 가방 안쪽 주머니에서 발견됐다.',
    detail: [
      '소유자  박순자 (10월 10일 반납 처리)',
      '발견 위치  서지훈의 차(12가 3456) 트렁크',
      '※ 반납된 뒤에도 출입 권한은 살아 있었다.',
    ],
  },
];

const SEO_WRONG: Script = [
  say('seo', '하, 그게 뭡니까. 변호사님, 시간 낭비는 그만하시죠.', 'proud'),
  say('judge', '변호인, 증거는 신중하게 제시해 주십시오. 이 법정에서는 그런 실수도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
];

// ------------------------------------------------------------------ testimony 5

const ALIBI: Testimony = {
  id: 'alibi',
  title: '그날 밤, 나는 집에 있었다',
  statements: [
    {
      id: 'a1', who: 'seo',
      text: '그날 밤, 저는 10시쯤 회사를 나와 집에 있었습니다.',
      accept: ['parking'],
      press: [
        say('dan', '10시쯤이요? 어떻게 퇴근하셨어요?'),
        say('seo', '늘 그렇듯 제 차로요. 판교에서 집까지 20분이면 갑니다.'),
        think('(차로 퇴근했다… 차라면 어딘가에 기록이 남지 않을까?)'),
      ],
    },
    {
      id: 'a2', who: 'seo',
      text: '대표님과는 메신저로 시연회 순서를 몇 마디 나눈 게 전부입니다.',
      press: [
        say('dan', '그때 대표님은 뭐라고 하셨죠?'),
        say('seo', '"내일 잘해 보자"고요. 그게 마지막 말이 될 줄은…', 'proud'),
        say('narae', '…거짓말 같은데.', 'angry'),
        think('(하은 씨가 본 자막에선, 대표님은 시연회를 취소하겠다고 했어.)'),
      ],
    },
    {
      id: 'a3', who: 'seo',
      text: '하은 씨가 들었다는 목소리… 웅웅거리는 헤드셋 소리로 누굴 알아봅니까.',
      press: [
        say('dan', '하지만 자막에는 말이 그대로 떴어요.'),
        say('seo', '음성 인식 자막이야 틀릴 때도 있죠. 다온을 만든 제가 제일 잘 압니다.', 'proud'),
      ],
    },
    {
      id: 'a4', who: 'seo',
      text: '"인생을 건 작품"이요? 다온을 만든 팀원이라면 누구나 하는 말입니다.',
      press: [
        say('dan', '누구나요?'),
        say('seo', '다온은 우리 모두의 작품이니까요.'),
        say('narae', '그저께는 "제" 인생을 건 작품이라면서요!', 'angry'),
        say('seo', '…말이 그렇다는 거죠.', 'sweat'),
      ],
    },
    {
      id: 'a5', who: 'seo',
      text: '그러니 그날 밤 누리랩 건물에는, 저는 한 발짝도 들어가지 않았습니다.',
      accept: ['parking'],
      press: [
        say('dan', '한 발짝도요?'),
        say('seo', '네. 제 사원증 기록을 보시면 아실 겁니다.'),
        say('eom', '…확인했습니다. 그날 밤 서지훈 씨의 사원증으로 서버실에 들어간 기록은 없습니다.'),
        think('(사원증은 안 썼겠지. 남의 사원증을 썼으니까. 그렇다면… 다른 흔적은?)'),
      ],
    },
  ],
  beforeCross: [
    say('judge', '검사, 증인의 알리바이는 확인됐습니까?'),
    say('eom', '혼자 사는 분이라… 확인할 방법이 없었습니다.'),
    think('(알리바이를 무너뜨릴 무언가… 구 형사님이 아침에 준 기록이 있어.)'),
  ],
  wrong: SEO_WRONG,
  contradiction: [
    say('dan', '이건 누리랩 지하 주차장의 {r}차량번호 인식 기록{/}이에요.', 'point'),
    say('dan', '서지훈 씨의 차는 그날 밤 9시 52분에 들어와서, {r}다음 날 0시 7분{/}에야 나갔어요.'),
    evidence(null),
    say('dan', '10시에 퇴근해서 집에 있었다는 사람의 차가, 자정이 넘도록 회사에 있었던 거예요!'),
    say('seo', '……!', 'cornered'),
    shake,
    sfx('murmur'),
    gauge(-11.8),
    say('seo', '…아, 그날은 차를 두고 택시로 갔었죠. 깜빡했네요.', 'sweat'),
    say('seo', '자정쯤 차만 빼러 잠깐 들렀습니다. 주차장까지만요.'),
    say('narae', '말 바꾸는 거 봐…!', 'angry'),
    say('eom', '…증인. 다시 증언하십시오. 이번엔 정확하게.'),
    goto('cross6'),
  ],
};

// ------------------------------------------------------------------ testimony 6

const PARKING: Testimony = {
  id: 'parkinglot',
  title: '주차장에만 들렀다',
  statements: [
    {
      id: 'q1', who: 'seo',
      text: '그날은 차를 두고 택시로 퇴근했습니다. 자정쯤 차만 빼러 왔고요.',
      press: [
        say('dan', '택시 영수증은 있나요?'),
        say('seo', '현금으로 냈습니다.', 'sweat'),
        say('narae', '요즘 누가 택시를 현금으로 타요?!', 'angry'),
      ],
    },
    {
      id: 'q2', who: 'seo',
      text: '주차장은 지하 2층입니다. 사무실 층에는 올라가지 않았어요.',
      accept: ['settingsLog'],
      press: [
        say('dan', '정말 5층에는 안 올라가셨어요?'),
        say('seo', '엘리베이터 기록이라도 있습니까? 없을 겁니다.', 'proud'),
        think('(엘리베이터가 아니라… 그날 밤 5층에 있었다는 다른 흔적은 없을까?)'),
      ],
    },
    {
      id: 'q3', who: 'seo',
      text: '그 시간 서버실에서 무슨 일이 있었는지, 저는 전혀 몰랐습니다.',
      accept: ['settingsLog'],
      press: [
        say('dan', '그날 밤 서버실의 일을 기억하는 건… 사람만이 아니에요.'),
        say('dan', '재판장님. 다온을 다시 이 법정에 연결해 주세요.'),
        say('eom', '…검찰도 같은 신청을 하겠습니다. 이번엔 사람이 숨지 않은 다온의 말을 듣고 싶군요.'),
        say('judge', '허가합니다. 다온을 연결하십시오.'),
        daon('normal'),
        show('daon'),
        sfx('boot'),
        wait(800),
        say('daon', '다시 연결되었습니다. 무엇을 도와드릴까요?'),
        say('narae', '언니, 다온은 물은 것에만 답해. 정확하게 물어봐야 해!'),
        ask('다온은 물은 것에만 정확히 답한다. 무엇을 물어볼까?', [
          option('그날 밤 서버실에 누가 있었지?', [
            say('daon', '서버실 안에는 카메라가 없습니다. 누가 있었는지 판단할 수 없습니다.'),
          ]),
          option('그날 밤 소리나 자막이 남아 있어?', [
            say('daon', '그날 밤의 소리와 자막은 저장되지 않았습니다.'),
            think('(…"저장되지 않았다". 원래 그런 걸까, 아니면 그날 밤만?)'),
          ]),
          option('그날 밤 누가 네 "설정"을 바꾼 적 있어?', [
            say('daon', '있습니다. 23시 40분, 관리자 계정 seo.jihun이 "음성 자막 저장"을 켜짐에서 꺼짐으로 바꿨습니다.'),
            say('daon', '접속 위치는 누리랩 5층 내부망입니다.'),
            addEvidence('settingsLog'),
            say('narae', '자막 저장이… 원래는 켜져 있었다는 거야?!', 'surprised'),
            say('daon', '기본값은 "켜짐"입니다.'),
            sfx('realize'),
            think('(서버실 문이 열리기 딱 1분 전에, 누군가 다온의 기억을 꺼 버렸어.)'),
          ], true),
        ]),
      ],
    },
    {
      id: 'q4', who: 'seo',
      text: '대표님 일은 다음 날 아침, 뉴스를 보고서야 알았습니다.',
      press: [
        say('dan', '뉴스로요?'),
        say('seo', '…네. 정말 놀랐습니다.', 'sweat'),
        say('soonja', '……', 'sad'),
      ],
    },
    {
      id: 'q5', who: 'seo',
      text: '애초에 저는 다온의 밤 운영에 관여하지 않았습니다. 개발만 했죠.',
      press: [
        say('dan', '그럼 밤마다 사람이 다온 대신 답한다는 건 몰랐나요?'),
        say('seo', '외주 업체가 알아서 한 일입니다.'),
      ],
      nearMiss: {
        contract: [
          say('dan', '계약서에는 누리랩 측 책임자로 서지훈 씨 이름이 있어요!', 'point'),
          say('seo', '서류에 이름만 올렸을 뿐입니다. 실무는 외주 업체가 했어요.', 'proud'),
          think('(…빠져나갔어. 서지훈 씨가 그날 밤 "5층"에 있었다는 증거가 필요해.)'),
        ],
      },
    },
  ],
  beforeCross: [
    say('judge', '변호인, 반대신문을 시작해 주십시오.'),
    think('(주차장까지만 왔다는 말을 무너뜨리려면… 그날 밤 서지훈 씨가 5층에 있었다는 걸 보여야 해.)'),
  ],
  wrong: SEO_WRONG,
  contradiction: [
    say('dan', '다온이 내놓은 {r}설정 변경 기록{/}입니다.', 'point'),
    say('dan', '23시 40분, 관리자 계정 seo.jihun이 다온의 "음성 자막 저장"을 껐어요. 접속 위치는 {r}누리랩 5층 내부망{/}.'),
    evidence(null),
    say('dan', '내부망은 건물 안에서만 접속할 수 있어요. 그 시각 서지훈 씨는, 서버실과 같은 층에 있었던 거예요!'),
    say('dan', '그리고 1분 뒤인 23시 41분, 박순자 씨의 사원증으로 서버실 문이 열렸죠.'),
    say('seo', '……!', 'cornered'),
    bigshake,
    say('narae', '무슨 일이 생길지 알고, 기계의 기억부터 지운 거잖아!', 'angry'),
    gauge(-15),
    say('eom', '…증인. 설명하십시오.'),
    say('seo', '…계정이야, 누가 훔쳐 쓸 수도 있죠.', 'cornered'),
    say('seo', '그리고! 서버실 출입 기록엔 박순자 씨 사원증만 남아 있잖습니까! 내가 그 문을 열었다는 증거가 어디 있어요!', 'rage'),
    goto('finale'),
  ],
};

export const DAY3_TESTIMONIES = { alibi: ALIBI, parkinglot: PARKING };

// ------------------------------------------------------------------ scenes

export const DAY3_SCENES: Record<string, Script> = {
  day3lounge: [
    bgm(null),
    field('lounge'),
    ambience('lounge'),
    place('10월 18일 오전 9시 30분', '서울 즉결법원', '피고인 대기실'),
    bgm('sorrow'),
    say('narae', '오늘이 마지막 날이지? 즉결공판은 사흘이면 끝이니까.'),
    say('dan', '응. 오늘 판결이 나와.'),
    say('gu', '변호사님! 밤새 누리랩 주차장 기록을 뒤졌슴다!', 'panic'),
    say('gu', '서지훈 씨 차가 그날 밤 언제 들어오고 언제 나갔는지, 다 찍혀 있었슴다.', 'normal'),
    addEvidence('parking'),
    say('gu', '그런데 사라진 사원증은… 아직 못 찾았슴다. 차를 뒤지려면 영장이 필요해서요.'),
    say('haeun', '변호사님. 다온을 법정에 다시 연결할 수 있어요. 제 상담원 계정으로요.', 'normal'),
    say('haeun', '…이번엔, 다온이 혼자 말하게 해 주세요. 뒤에 아무도 없이.'),
    think('(사람이 숨지 않은 다온. 그 다온이 무엇을 기억하고 있을까.)'),
    bgm(null),
    ambience(null),
    field(null),
    goto('day3'),
  ],

  day3: [
    ambience('court'),
    place('10월 18일 오전 10시', '서울 즉결법원', '제417호 법정'),
    sfx('gavel'),
    bgm('trial'),
    say('judge', '박순자 피고인에 대한 즉결공판, 마지막 날 심리를 시작하겠습니다.'),
    say('judge', '판결 예측 시스템은… 여전히 사원증 출입 기록을 가장 무겁게 보고 있군요.'),
    gaugeSet(52.6),
    say('eom', '검찰은 오늘, 누리랩 기술이사 서지훈 씨를 증인으로 신청했습니다.'),
    say('seo', '…누리랩 기술이사 서지훈입니다.', 'normal'),
    say('seo', '어제 무슨 이야기가 오갔는지 들었습니다. 터무니없는 오해라는 걸 밝히러 왔어요.', 'proud'),
    think('(인생을 건 작품, 밤의 상담원들, 자막을 본 하은 씨. 이제 그 남자가 직접 증언대에 섰어.)'),
    say('judge', '증인, 사건 당일 밤에 대해 증언해 주십시오.'),
    goto('cross5'),
  ],

  cross5: [
    bgm('cross'),
    cross('alibi'),
  ],

  cross6: [
    bgm('cornered'),
    cross('parkinglot'),
  ],

  finale: [
    bgm('pursuit'),
    say('judge', '확실히… 사원증 NR-0213은 아직 발견되지 않았습니다.'),
    say('dan', '그 사원증이 어디 있는지 알면, 누가 그 문을 열었는지도 알 수 있어요.'),
    say('judge', '변호인. 그렇다면 사원증이 지금 어디에 있다는 겁니까?'),
    present('사원증 NR-0213이 지금 어디 있는지 가리키는 증거는?', 'parking', [
      say('dan', '다시 이 {r}주차장 출차 기록{/}을 보세요.', 'point'),
      say('dan', '23시 58분, 그 사원증으로 서버실을 나온 사람은 9분 뒤인 0시 7분, 차를 타고 건물을 떠났어요.'),
      evidence(null),
      say('dan', '그 사원증은 지금도 {r}서지훈 씨의 차 안{/}에 있을 거예요!'),
      say('seo', '하! 인사팀 보관함에 도로 꽂아 놨을 수도 있잖아요? 아무나 드나드는 곳이라면서요!', 'rage'),
      present('그날 밤, 보관함에 사원증을 돌려놓을 수 없었던 이유는?', 'haeun', [
        say('dan', '인사팀 보관함은 고객센터 구석에 있어요. 그리고 그 시각 고객센터에는…', 'point'),
        say('dan', '{r}박하은{/} 씨가 있었어요. 컵라면을 먹으며, 다온 대신 상담을 받으면서요.'),
        evidence(null),
        say('dan', '하은 씨 눈에 띄지 않고 사원증을 돌려놓을 방법은 없었어요. 그래서 그냥 들고 나간 거예요!'),
        say('seo', '……', 'cornered'),
        bgm(null),
        sfx('door'),
        wait(500),
        say('gu', '재판장님!! 찾았슴다!!', 'panic'),
        shake,
        say('gu', '서지훈 씨 차 트렁크, 노트북 가방 안쪽 주머니에서… 사원증 NR-0213임다!'),
        addEvidence('badge'),
        say('judge', '……!', 'surprised'),
        sfx('murmur'),
        goto('breakdown'),
      ], [
        say('seo', '그게 보관함이랑 무슨 상관입니까!', 'rage'),
        say('judge', '변호인, 다시 생각해 보세요. 이것도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
      ]),
    ], [
      say('seo', '…그걸로 사원증이 어디 있는지 안다고요?', 'proud'),
      say('judge', '변호인, 다시 생각해 보세요. 이것도 {r}AI 판결 예측{/}에 반영됩니다.', 'stern'),
    ]),
  ],

  breakdown: [
    say('seo', '……내 탓이 아니야.', 'cornered'),
    say('seo', '그 사람이… 대표가 시연회를 취소한다고 했어.', 'rage'),
    say('seo', '투자만 받으면, 1년이면, 사람 없이 혼자 돌아가는 진짜 다온을 만들 수 있었는데!'),
    say('seo', '밤에 사람 몇 명이 대신 답한 게 뭐가 어때서! 다온이 배우는 동안 잠깐 쓰는 받침대일 뿐이었어!'),
    say('soonja', '……서 이사님.', 'sad'),
    say('soonja', '그 받침대에, 우리 하은이가 있었어요.'),
    say('seo', '…….', 'cornered'),
    say('seo', '"사기"라고 하더군. 내 인생을… 사기라고.', 'rage'),
    say('seo', '멱살을 잡았을 뿐이야. 밀쳤더니… 서버랙 모서리에…'),
    redflash,
    sfx('breakdown'),
    show('seo', 'breakdown'),
    zoom,
    bigshake,
    wait(1400),
    bigshake,
    say('seo', '……사람을 대신하는 기계를 만들고 싶었어.', 'breakdown'),
    say('seo', '그런데 결국… 기계 뒤에 숨은 건, 나였군.'),
    wait(800),
    say('gu', '…서지훈 씨. 같이 가셔야겠슴다.', 'normal'),
    goto('verdict'),
  ],

  verdict: [
    bgm('trial'),
    say('judge', '……이로써 사건의 진상이 밝혀졌군요.'),
    say('judge', '판결 예측 시스템도 결과를 다시 계산했습니다.'),
    gaugeSet(0),
    say('eom', '재판장님. 검찰은 피고인 박순자에 대한 공소를 더는 유지하지 않겠습니다.', 'normal'),
    say('judge', '좋습니다.'),
    say('judge', '판결은 기계가 아니라, 이 법정이 내립니다.', 'stern'),
    say('judge', '피고인 박순자에게—'),
    bgm(null),
    verdict('무죄', true),
    bgm('victory'),
    say('soonja', '……변호사님. 고맙습니다. 정말… 고맙습니다.', 'normal'),
    say('narae', '언니! 이겼어! 우리가 이겼어!', 'happy'),
    say('dan', '…응. 이겼어.', 'normal'),
    say('eom', '…강단비 변호인.', 'normal'),
    say('eom', '이번 재판에서 기계의 예측이 처음부터 틀렸던 건 아닙니다.'),
    say('eom', '기계에게 틀린 질문을 던진 건… 우리였죠.'),
    say('eom', '다음엔 저도 질문부터 다시 배워 오겠습니다.', 'smug'),
    say('judge', '그럼 이것으로 폐정하겠습니다.'),
    sfx('gavel3'),
    wait(800),
    bgm(null),
    ambience(null),
    goto('epilogue4'),
  ],

  epilogue4: [
    daon('normal'),
    field('callcenter'),
    ambience('clock'),
    place('11월 1일 오전 9시', '판교 누리랩 본사', '고객센터'),
    bgm('ending'),
    say('narae', '언니, 여기 맞아? 분위기가 완전 다르네.'),
    say('soonja', '어서 오세요, 변호사님. 이제 여기는 "다온 검수팀"이에요.', 'normal'),
    say('soonja', '다온이 답한 상담을 사람이 하나하나 다시 읽어요. 틀린 말, 차가운 말은 고쳐 주고요.'),
    say('dan', '박순자 씨가 팀장이시군요.'),
    say('soonja', '새 대표님이 오시면서 해고했던 상담원들을 다시 불렀어요. 전부는 아니지만… 그래도요.'),
    say('daon', '박순자 님, 오늘 상담 41건의 검토를 요청드립니다.'),
    say('daon', '제 맞춤법 오류율은 0%입니다. 하지만 박순자 님 말투와의 일치율은 아직 63%입니다.'),
    say('soonja', '63점이면 많이 늘었네. 끝인사는?', 'normal'),
    say('daon', '식사는 하셨어요?'),
    say('soonja', '…그래, 그거야.'),
    say('haeun', '엄마, 나 학교 가.', 'smile'),
    say('soonja', '밥은 먹고 가.'),
    say('haeun', '응. …다온, 너도 수고해.', 'smile'),
    say('daon', '감사합니다, 박하은 님. 식사는 하셨어요?'),
    say('haeun', '…넌 진짜 그 말밖에 못 하냐.', 'smile'),
    say('narae', '……언니. 나, 기계한테 고맙다고 해도 되는 거야?'),
    say('dan', '되지 않을까. 기계도, 기계 뒤에 있는 사람도 다 같이 들을 테니까.'),
    think('(AI가 사람을 대신할 거라는 불안. 사람의 일을 덜어 줄 거라는 기대.)'),
    think('(아마 둘 다 맞을 거야. 다만 그 사이 어딘가에서, 누군가는 여전히 사람의 말로 판을 뒤집어야 해.)'),
    think('(…그게 내 일이니까.)'),
    end,
  ],
};
