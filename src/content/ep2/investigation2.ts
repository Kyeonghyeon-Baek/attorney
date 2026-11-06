import { guideDayTwo } from './investigation-flow';
import type { Location, Script } from '../../engine/types';
import {
  addEvidence, addProfile, ambience, annotate, app, bgm, choose, examine, fadeIn, fadeOut, field, flag, goto,
  investigate, memo, note, option, place, revise, say, sayAs, sfx, shake, spot, think, tint, wait, when,
} from '../script';

// 2일차 조사 (6/18). 새 장소 다섯(관리사무실·고철 컨테이너·변복만 옥상·하늘사다리·검사실). docs/ep2/play-flow.md §7.
// 시간: 아침 공사 현장 → 고철 확보 → 단서별 동선 → (필수를 모으고 조사를 마치면) 15시 정한의 전화로 검사실 → 저녁 정한의 연락(홈캠 원본) → 노을의 옥상.

const MORNING = ['d2roof', 'd2mgmt', 'd2laundry', 'd2scrap', 'd2byeon', 'd2visit', 'd2shrine', 'd2ladder'];
const others = (id: string) => [...MORNING.filter((x) => x !== id), 'd2prosecutor'];

export const DAY2_GOALS = [
  'd2:video4k', 'd2:laundryBag', 'd2:binBag', 'originals', 'ladderLog',
  'd2:strapSeen', 'd2:soyoonConsent', 'd2:signMeasured', 'd2:cctvAsked',
];

/** The first of the two finds puts the loose-parts card in the record; each adds its own part. */
const partsCard: Script = [addEvidence('looseParts')];

export const DAY2_LOCATIONS: Record<string, Location> = {
  // ---------------------------------------------------------------- 06:50 옥상 — 멈춘 공사
  d2roof: {
    id: 'd2roof', name: '행복하우스 옥상', bg: 'happyRoofW', bgm: 'dalbit', ambience: 'village', arrive: 'door',
    person: 'gu', connects: others('d2roof'),
    enter: [
      sfx('creak'),
      sayAs('foreman', '공사 반장', '자, W4 끝은 잘라 냈고! 이제 저 회색 칸 남은 거랑 끈 걷어 내고…'),
      say('gu', '거기 절단기 코드 당장 뽑으십쇼!', 'serious'),
      shake,
      say('gu', '볼트 한 톨도 현장 보존임다. 이 밑동은 못 하나까지 증거임다!', 'serious'),
      sayAs('foreman', '공사 반장', '아, 아니 관리소장님이 어젯밤 급하게 부르셔서…'),
      say('narae', '헉, 헉… 아침 여섯 시 반부터 절단기를 돌리면 어떡해요!', 'angry'),
      say('dan', '구 형사님, 연락 주셔서 다행이에요. 아직 중앙 칸 밑동은 그대로죠?', 'normal'),
      say('gu', '간발의 차였슴다. 봉인하겠슴다. W2, 잔존부, 저 끈까지 전부.', 'serious'),
      think('(아슬아슬했어. 30분만 늦었으면 이 옥상의 증거는 고철 차에 실렸을 거야.)'),
      think('(해 뜨자마자 4층 계단을 뛰어올랐더니 모닝커피보다 잠이 확 깨네.)'),
    ],
    hotspots: [
      { id: 'strap', label: '래칫 끈', x: 450, y: 465, w: 475, h: 125,
        script: [
          note('이번엔 끈을 손에 들고 본다. 빨래대 쪽 고리, 그리고 반대쪽 고리에 밝은 회색 페인트가 묻어 있다. 래칫 레버는 젖혀져 있다.'),
          note('파란 방수포의 구멍(아일릿)은 새것처럼 반짝인다. 끈이 걸렸던 흔적이 없다.'),
          say('gu', '천 날리지 말라고 묶었다면서, 파란 천 구멍은 왜 새것처럼 반짝거림까?', 'serious'),
          say('gu', '쇠 갈고리 안쪽엔 허연 회색 페인트만 잔뜩 긁혀 묻었슴다.', 'serious'),
          say('narae', '잠깐, 저 회색이면… 떨어진 중앙 난간이랑 똑같은 색이잖아?', 'surprised'),
          say('dan', '게다가 조임 레버가 끝까지 젖혀져 있어요. 저절로 풀린 모양이 아니에요.', 'point'),
          think('(천을 묶은 끈이라면 천 구멍에 자국이 남았어야 해. 이 끈은… 난간에 걸려 있었어.)'),
          memo('[확인] 래칫 끈 고리엔 W3와 같은 회색 페인트, 방수포 구멍엔 끈 흔적 없음. 끈은 천이 아니라 난간을 당기고 있었다.'),
          say('gu', '이것도 봉인해서 구조 감정에 보태겠슴다. 결과는 내일 아침이면 나옴다.', 'serious'),
          flag('d2:strapSeen'),
        ] },
      { id: 'bolts', label: '앵커 볼트 넷', x: 290, y: 285, w: 695, h: 100,
        script: [
          note('볼트의 나사산이 깨끗하다. 녹슬어 부러진 게 아니다.'),
          say('dan', '구 형사님, 솟아 있는 볼트 네 개 좀 보세요. 나사산 결이 멀쩡해요.', 'point'),
          say('gu', '그러게 말임다. 힘 받아서 뜯겨 나갔으면 산이 다 뭉개졌을 검다.', 'serious'),
          say('narae', '그럼 저 위에 끼워져 있던 너트 네 개는 어디로 간 건데…?', 'surprised'),
          think('(세월이 갉아먹은 자리가 아니야. 사람 손이 렌치를 쥐고 다녀간 자리야.)'),
          memo('[확인] W3 앵커 볼트 나사산이 깨끗하다. 너트는 녹슬어 빠진 게 아니라 풀렸다.'),
        ] },
      { id: 'tie', label: 'W2 끝의 노란 타이', x: 235, y: 160, w: 110, h: 100,
        script: [
          say('cheolju', '그건 제가 6월 11일에 테이프 묶은 타이입니다. 하나가 남았군요.', 'guilty'),
          say('narae', '어? 점검 기사 아저씨, 이 새벽에 여긴 언제부터 계셨어요?', 'surprised'),
          say('cheolju', '어제 재판 끝나고 잠이 와야 말이지요. 혹시 남은 밑동까지 치울까 봐 나와 봤습니다.', 'guilty'),
          say('cheolju', '"기대지 마시오" 한 줄이 사람 목숨 줄인데, 그걸 누가 가위로 싹둑 잘라 놨으니…', 'lecture'),
          say('dan', '기사님이 새벽같이 나와 주신 덕분에 인부들 손도 늦출 수 있었어요.', 'normal'),
          think('(윤철주 씨도 밤새 마음이 무거웠구나. 자기가 친 경고를 끝까지 지키러 왔어.)'),
        ] },
    ],
    talks: [
      { id: 'foreman', label: '공사 반장', script: [
        say('dan', '반장님, 재판 중인 현장인데 누구 지시로 철거부터 나오신 거예요?'),
        sayAs('foreman', '공사 반장', '안 소장님이 어젯밤 급하게. 헌 건 철거 구역 컨테이너에 버리라고 하셨어요.'),
        sayAs('foreman', '공사 반장', '위험한 흉물 빨리 치워야 동네 어르신들 안 놀란다고, 새벽 웃돈까지 주셨거든요.'),
        say('narae', '태수 아저씨가요? 어젯밤에 갑자기…?', 'surprised'),
        sayAs('foreman', '공사 반장', '네. 지난주에도 저기 봉투 하나 버리시던데. 오늘 세 시에 고철 차 와요.'),
        say('dan', '세 시요. 고맙습니다, 반장님. 그 컨테이너 위치부터 확인해야겠네요.', 'point'),
        think('(어제 법정에서 난간 부실 얘기가 나오자마자 밤사이에 철거 지시라… 발이 너무 빨라.)'),
        memo('공사 반장: 헌 난간은 철거 구역 고철 컨테이너로. 안태수가 지난주에도 거기 봉투를 버렸다. 오늘 15시 고철 수거.'),
        flag('d2:scrapHint'),
      ] },
    ],
    presentDefault: [
      say('gu', '지금은 봉인이 먼저임다! 노란 폴리스 라인부터 팽팽하게 치겠슴다!', 'serious'),
      think('(구 형사님이 저렇게 진지할 땐 건드리지 않는 게 상책이야.)'),
    ],
  },

  // ---------------------------------------------------------------- 관리사무실 — 노은결 입회
  d2mgmt: {
    id: 'd2mgmt', name: '행복하우스 관리사무실', bg: 'mgmtOffice', bgm: 'dalbit', ambience: 'hum',
    person: 'eungyeol', connects: others('d2mgmt'),
    enter: [
      say('eungyeol', '세입자 총무로 입회할게요. 어제 방청석에서 듣다가 피가 거꾸로 솟을 뻔했어요!', 'firm'),
      say('eungyeol', '우린 동쪽 길가에 검은 타이로 현수막만 묶었지, 서쪽 난간엔 발끝도 안 댔거든요.', 'firm'),
      say('narae', '와, 은결 언니 목소리 큰 거 처음 봐. 어제 진짜 열받았나 보다.', 'surprised'),
      say('eungyeol', '당연하죠! 소윤 언니가 보증금 묶인 집들 등기부까지 밤새워 정리해 준 사람인데…', 'worried'),
      say('dan', '총무님이 입회해 주셔서 든든해요. 사무실 안을 차근차근 살펴볼게요.', 'normal'),
      think('(수줍던 은결 씨가 총무 수첩을 꽉 쥐고 있어. 규칙 지키는 사람이 화나면 무섭거든.)'),
    ],
    hotspots: [
      { id: 'safe', label: '열린 금고', x: 635, y: 205, w: 280, h: 240,
        script: [
          say('narae', '문짝만 덩그러니 열려 있네. 먼지 자국만 네모나게 남았어.', 'normal'),
          say('eungyeol', '최 사장님이 중요한 계약서라며 늘 잠가 두시던 자리예요.', 'worried'),
          think('(텅 빈 금고. 최 사장님은 옥상에서 "원본은 책상에 다 꺼내 놨다"고 했다지. 언제, 어떻게 꺼냈는지는 아직 몰라.)'),
        ] },
      { id: 'keys', label: '키 박스', x: 940, y: 150, w: 230, h: 195,
        script: [
          note('키 박스. 「마스터」라고 적힌 고리가 비어 있다.'),
          say('dan', '호수별 열쇠는 다 걸려 있는데, 맨 위 「마스터」 고리만 비어 있네요?'),
          say('eungyeol', '마스터 카드요? 키 박스에 두긴 뭘 둬요. 늘 안 소장 주머니에 있었어요.', 'firm'),
          say('eungyeol', '보일러실이든 옥상 문이든, 부르면 자기 점퍼 주머니에서 쓱 꺼내 찍었는걸요.', 'normal'),
          say('narae', '맞아… 할머니네 수도 얼었을 때도 아저씨가 만능키 있다며 바로 열어 줬었어.', 'normal'),
          think('(키 박스에 걸어 두는 공용 카드가 아니라, 사실상 개인 소지품이었단 뜻이네.)'),
          memo('노은결: 관리 마스터 카드는 키 박스에 없다. "늘 안 소장 주머니에".'),
        ] },
      { id: 'speaker', label: '블루투스 스피커', x: 945, y: 35, w: 125, h: 90,
        script: [
          say('narae', '어, 저 선반 위 동그란 건 스피커 아니야? 최 사장님 음악도 들으셨나?', 'normal'),
          say('eungyeol', '그게 홈캠이에요. 최 사장님이 이달 초에 다셨어요. 스피커처럼 생겨서 다들 몰라요.', 'normal'),
          say('dan', '검찰에 넘어간 영상도 저기서 찍힌 거군요. 각도가 금고랑 책상을 한눈에 비추네요.', 'point'),
          think('(경찰이 낸 건 소윤 씨가 찍힌 발췌본뿐. 원본 전체엔 소윤 씨 말고 누가 또 찍혔을까.)'),
          flag('d2:camFound'),
        ] },
      { id: 'printer', label: '프린터', x: 950, y: 375, w: 230, h: 145,
        script: [
          note('프린터 화면: 「최근 작업 06/14 20:21」.'),
          say('dan', '프린터 액정에 아직 마지막 작업 기록이 떠 있어요. 6월 14일 20시 21분.', 'point'),
          say('narae', '20시 21분이면… 구급차 사이렌 소리도 아직 골목에 남아 있을 시간이잖아.', 'surprised'),
          think('(출입 기록 출력 시각과 정확히 같아. 사건 35분 뒤, 누군가 아주 침착하게 버튼을 눌렀어.)'),
        ] },
    ],
    talks: [
      { id: 'chat', label: '그날 단톡', script: [
        say('eungyeol', '제가 단톡 올린 게 일곱 시 삼십구 분이잖아요. 그때 최 사장님, 계단 올라가시면서 휴대폰만 들여다보고 계셨어요.', 'worried'),
        say('eungyeol', '원래는 세입자 마주칠까 봐 두리번거리던 분이, 그날은 꼭 약속 시간 맞추는 사람처럼 올라가셨어요…', 'tears'),
        say('dan', '은결 씨 잘못이 아니에요. 약속 정산하러 간 건 당연한 권리니까요.', 'normal'),
        say('eungyeol', '그날 단톡도 제가 올렸으니까… 언니 누명 벗길 건 저도 끝까지 찾을 거예요.', 'firm'),
        say('narae', '…저 언니도 참, 자기 보증금만 챙긴 줄 알았더니 사람은 안 잃었네.', 'normal'),
        think('(나래 입에서 소윤 씨 흉이 아니라 저런 말이 나오다니. 해가 서쪽에서 뜨겠어.)'),
      ] },
    ],
    presentDefault: [
      say('eungyeol', '제 총무 장부엔 없는 내용이에요. 그건 언니가 더 잘 알 거예요.', 'worried'),
    ],
  },

  // ---------------------------------------------------------------- 정숙세탁 — 봉투와 간판
  d2laundry: {
    id: 'd2laundry', name: '정숙세탁', bg: 'laundry', bgm: 'dalbit', ambience: 'laundry', arrive: 'door',
    person: 'jeongsuk', connects: others('d2laundry'),
    enter: [
      say('jeongsuk', '변호사님… 나 어제 집에 가서 한숨도 못 잤어.', 'sorry'),
      say('jeongsuk', '난간이 먼저 흔들린 걸 빼먹었더라. 그러고는 다 봤다고 우겼네.', 'sorry'),
      say('dan', '법정에서 바로잡는 게 쉬운 일이 아닌데, 솔직하게 말씀해 주셔서 고마웠어요.', 'normal'),
      say('narae', '정숙 이모, 눈 밑이 쑥 들어갔어. 어제 밤새 다리미만 붙잡고 계셨지?', 'normal'),
      say('jeongsuk', '속 시끄러울 땐 주름 펴는 게 약이여. 남의 인생 구길 뻔했으니 잠이 오나.', 'shaken'),
      think('(수다는 많아도 거짓말은 못 담는 분이야. 덕분에 중요한 실마리가 열렸어.)'),
    ],
    hotspots: [
      { id: 'drawer', label: '봉투 서랍', x: 995, y: 65, w: 280, h: 370, done: 'd2:laundryBag', ready: 'd2:jacketTold',
        // Once opened, later clicks get the aftermath (an `again` would also fire after a refusal).
        script: [
          when('d2:laundryBag', [
            say('jeongsuk', '안 사장 봉투는 방금 형사님이 챙겨 갔어. 내 서랍엔 이제 동네 단골들 단추랑 동전뿐이여.', 'normal'),
            think('(점퍼에서 나온 너트와 타이는 이미 확보했어. 다른 곳을 마저 살펴보자.)'),
          ], [
            when('d2:jacketTold', [
              say('gu', '임의 제출로 받겠슴다. 배 사장님, 봉투 여시겠슴까?', 'serious'),
              say('jeongsuk', '자, 여기 「안 사장 6/13」. 내가 날짜랑 이름까지 매직으로 딱 적어 놨지.', 'normal'),
              note('봉투 「안 사장 6/13」. 안감 솔기에 끼어 있던 녹슨 너트 하나와, 끊긴 노란 타이 하나.'),
              say('gu', 'M12 규격… 아까 옥상에서 본 그 앵커 볼트에 딱 맞는 크기임다.', 'serious'),
              say('narae', '…잠깐만. 옥상 볼트 너트가 왜 태수 아저씨 점퍼에서 나와요?', 'surprised'),
              say('jeongsuk', '안감 뜯어진 솔기 틈에 쏙 박혀서 세탁기 통 다 긁어 놓을 뻔했다니까.', 'gossip'),
              ...partsCard,
              annotate('looseParts', '[세탁소] 배정숙 장부 "6/13 10:55 달빛공인 안 사장 작업 점퍼 녹물(길에서 받음)". 봉투 「안 사장 6/13」: 녹슨 M12 너트 1개(점퍼 안감 솔기에 끼어 있었다) · 끊긴 노란 타이 1개.'),
              flag('d2:laundryBag'),
              when('d2:binBag', [think('(컨테이너의 셋과 합치면… 넷. 볼트 네 자리의 짝이 다 모였어.)')]),
            ], [
              say('jeongsuk', '남의 봉투는 그냥은 못 열어. 사연이 있어야지.', 'confident'),
              say('narae', '세탁소 서랍이 무슨 은행 금고보다 깐깐하네.', 'normal'),
              think('(안 사장 옷을 맡게 된 경위부터 먼저 여쭤보자.)'),
            ]),
          ]),
        ] },
    ],
    talks: [
      { id: 'jacket', label: '안 사장 점퍼', script: [
        say('dan', '금요일에 맡았다던 안 소장님 작업 점퍼요. 어떻게 받으신 건지 기억나세요?'),
        say('jeongsuk', '13일 아침 열한 시 다 돼서였나. 안 사장이 행복하우스에서 내려오는 걸 길에서 붙잡았지.', 'gossip'),
        say('jeongsuk', '소매가 시뻘건 녹물 범벅이라, "지금 안 빼면 옷 버려!" 하고 벗겨 왔어.', 'gossip'),
        say('narae', '길 가던 사람 겉옷을 그 자리에서 벗겨 오셨다고요?', 'surprised'),
        say('jeongsuk', '그럼! 쇳독 녹물은 해 넘기면 약으로도 못 빼거든. 세탁 삼십 년 자존심이지!', 'confident'),
        say('jeongsuk', '주머니 뒤집어 보면 그 사람 어제 뭐 했는지 다 나온다니까? 그래서 봉투에 모아 뒀지.', 'confident'),
        think('(13일 오전 10시 55분, 행복하우스 쪽에서 내려오던 길… 소매엔 시뻘건 녹물이라.)'),
        flag('d2:jacketTold'),
      ] },
      { id: 'sign', label: '옥상 간판', script: [
        say('jeongsuk', '우리 간판 얘기는 안 물어봐? 이 동네에서 제일 높다니까!', 'confident'),
        say('dan', '마침 여쭤보려고 했어요. 높이를 재 봐도 될까요?'),
        say('jeongsuk', '얼마든지 재 봐! 버스 정류장에서도 보이게 철골을 이층집만큼 올렸거든!', 'confident'),
        say('gu', '비켜 보십쇼. 레이저 거리계는 형사의 기본임다.', 'normal'),
        note('정숙세탁 옥상 간판틀 윗선: 행복하우스 옥상에서 약 34m 앞, 높이는 그 옥상 바닥보다 약 7.7m 위.'),
        annotate('dalbitMap', '[간판틀 · 6/18 구만두 측량] 정숙세탁 옥상 간판틀 윗선은 행복하우스 옥상에서 동북동 약 34m, 옥상 바닥 +7.7m.'),
        say('jeongsuk', '봐, 내가 그랬지? 그 옥상에선 우리 간판밖에 안 보인다니까.', 'confident'),
        think('(동북동 34미터 앞, 옥상 바닥보다 7.7미터 위. 시야 한복판을 떡하니 가로막는 높이야.)'),
        flag('d2:signMeasured'),
      ] },
    ],
    presentDefault: [
      say('jeongsuk', '그건 스팀 다리미로 백 번 밀어도 안 펴지는 얘기네.', 'normal'),
    ],
  },

  // ---------------------------------------------------------------- 고철 컨테이너
  d2scrap: {
    id: 'd2scrap', name: '철거 구역 고철 컨테이너', bg: 'scrapYard', bgm: 'dalbit', ambience: 'village',
    person: 'gu', connects: others('d2scrap'),
    enter: [
      say('gu', '세 시에 고철 차 온담다. 집게 차가 한 번 퍼 올리면 끝이니 그 전에 뒤져야 함다.', 'serious'),
      say('narae', '으… 녹 냄새 봐. 언니, 정장 소매 걷고 들어가야겠는데?', 'normal'),
      say('dan', '국선변호사 정장은 원래 먼지 털어가며 입는 거야. 위쪽부터 차례로 보자.', 'confident'),
      when('d2:scrapHint', [], [think('(이 컨테이너… 반장님 말대로라면 헌 난간이 여기 버려졌을 거야.)')]),
    ],
    hotspots: [
      { id: 'dig', label: '컨테이너 안', x: 260, y: 170, w: 920, h: 430,
        script: [
          examine('scrapYard', '컨테이너 안을 위에서부터 살펴보자', [
            spot('w4', '위층의 W4 토막', [550, 345, 370, 160], [
              note('오늘 아침 잘려 온 W4 끝. 아직 쇳가루 냄새가 난다.'),
              say('gu', '절단면이 반질반질함다. 오늘 새벽에 잘라다 던진 토막이 맞슴다.', 'serious'),
              think('(이 밑에 지난주부터 쌓인 고철들이 깔려 있겠지. 더 파 보자.)'),
            ]),
            spot('door', '공가의 문짝', [930, 305, 280, 220], [
              note('빈집에서 떼어 온 문짝. 문고리에 누가 걸어 둔 부적이 아직 붙어 있다.'),
              say('narae', '…저건 우리 할머니 거 아니야. 글씨체가 달라.', 'normal'),
              say('dan', '부적도 글씨체만 보고 구별해?', 'normal'),
              say('narae', '당연하지! 우리 할머니는 경면주사로 직접 긋지, 저런 인쇄 부적 안 써.', 'angry'),
              think('(무당집 막내 손녀의 감식안은 이럴 때 발휘되는구나.)'),
            ]),
            spot('bag', '바닥의 전단 봉투', [620, 580, 240, 100], [
              note('「달빛공인중개사」 전단이 인쇄된 비닐 봉투. 안에 노란 임시 클램프 둘(스텐실 "튼튼 0611")과 볼트 캡 넷, W3 색 페인트가 묻은 연결 클램프 넷, 녹슨 너트 셋, 감긴 노란 테이프.'),
              say('gu', '찾았슴다! 문짝 밑바닥 구석에 비닐 봉투가 끼어 있었슴다!', 'serious'),
              say('narae', '「달빛공인중개사」… 태수 아저씨네 개업 전단 봉투잖아.', 'surprised'),
              say('dan', '"튼튼 0611" 임시 클램프에 노란 경고 테이프, 연결 클램프 네 개까지 다 들어 있어요.', 'point'),
              ...partsCard,
              annotate('looseParts', '[컨테이너] 「달빛공인중개사」 전단 봉투: 노란 임시 클램프 2(스텐실 "튼튼 0611") · 볼트 캡 4 · 연결 클램프 4(W3 색 페인트) · 녹슨 M12 너트 3 · 감긴 노란 테이프.'),
              flag('d2:binBag'),
              when('d2:laundryBag', [think('(세탁소의 하나와 합치면… 녹슨 너트 넷이 딱 맞아떨어져.)')], [think('(너트가 셋뿐이네. 볼트는 네 개인데, 나머지 하나는 어디 갔지?)')]),
              say('narae', '그치만 저 전단 봉투는 동네 할머니들도 장바구니 대신 막 들고 다니는데…', 'sad'),
              think('(맞아. 봉투가 그 사무소 거라고, 버린 사람이 정해지진 않아. 더 확실한 물증이 필요해.)'),
            ]),
          ], 'd2:binBag'),
          say('gu', '고철 차 오기 전에 건져서 다행임다. 지문 안 번지게 바로 봉인하겠슴다!', 'serious'),
        ],
        again: [
          say('gu', '바닥 구석까지 싹 뒤졌슴다. 건질 만한 건 다 챙겼슴다.', 'serious'),
        ] },
    ],
    presentDefault: [
      say('gu', '여긴 녹슨 고철밖에 없슴다. 방금 제 벨트 버클도 긁혔슴다.', 'normal'),
    ],
  },

  // ---------------------------------------------------------------- 변복만 댁 옥상 텃밭
  d2byeon: {
    id: 'd2byeon', name: '변복만 댁 옥상 텃밭', bg: 'byeonRoof', bgm: 'dalbit', ambience: 'village',
    person: 'byeon', connects: others('d2byeon'),
    enter: [
      say('byeon', '내 상추가 이 동네에서 제일 비싸. 조망 가산 받았거든!', 'proud'),
      say('narae', '상추에도 가산이 붙어요?', 'surprised'),
      say('byeon', '붙지! 상추가 아침저녁으로 남산을 보고 크는데 맛이 같겠어?', 'proud'),
      say('narae', '삼겹살 싸 먹을 때 풍경 값까지 내야겠네.', 'normal'),
      say('dan', '위원장님 댁 옥상은 정말 탁 트였네요. 아래 골목이 한눈에 들어와요.', 'normal'),
      think('(여기선 행복하우스 옥상이 비스듬히 내려다보여. 13일 아침 영상도 여기서 찍었겠지.)'),
    ],
    hotspots: [
      { id: 'view', label: '난간 너머', x: 650, y: 30, w: 620, h: 400,
        script: [
          note('비스듬히 아래로 행복하우스 옥상. 봉인 테이프가 바람에 흔들린다.'),
          say('byeon', '추진위원장이란 자리가 원래 동네 지붕을 두루 살피는 자리여.', 'speech'),
          think('(거리도 가깝고 각도도 정확해. 단톡방 압축만 아니었으면 손끝까지 보였을 거야.)'),
        ] },
      { id: 'lettuce', label: '상추밭', x: 350, y: 490, w: 510, h: 220,
        script: [
          say('byeon', '싱싱할 때 한 포기 따 가. 다 달빛마을 대의를 위해서 키우는 상추여!', 'proud'),
          think('("대의를 위해서"라… 위원장님 마음을 움직이는 주문이 뭔지 알 것 같네.)'),
        ] },
    ],
    talks: [
      { id: 'original', label: '13일 영상 원본', script: [
        say('dan', '위원장님, 단톡방에 올리셨던 13일 아침 영상 말이에요. 휴대폰에 있는 원본을 볼 수 있을까요?'),
        say('byeon', '내 폰이 최신형 4K여! 단톡방에 올리니까 지 맘대로 깍두기가 돼서 그렇지!', 'proud'),
        say('byeon', '그, 근데 원본은 좀 곤란한디… 상추 물 주면서 부른 내 콧노래도 민망하고, 괜히 안 소장 입장이 난처해지면 동네 이주 일은 누가 돕냔 말여.', 'flustered'),
        say('narae', '위원장님, 저도 우리 할머니 하루라도 빨리 이사 가셨으면 좋겠거든요? 상자 위에서 밥 드시는 거 보기 싫어요.', 'sad'),
        say('narae', '그래도 안 한 일을 저 302호 언니한테 덮어씌우고 가는 건 싫어요. 아저씨가 수리한 게 맞으면 원본 봐도 괜찮잖아요!', 'angry'),
        choose('변복만에게', '어떻게 부탁할까?', [
          option('경찰에 압수해 달라고 할게요.', [
            say('byeon', '압수? 추진위원장 폰을? 그건 대의가 아니지!', 'flustered'),
            think('(괜히 공권력 얘기 꺼냈다가 자존심만 건드렸어. 다시 말씀드려 보자.)'),
          ]),
          option('콧노래는 아무도 안 들어요.', [
            say('byeon', '법정 스피커로 틀면 다 듣잖여! 내 바이브레이션은 내가 알아!', 'flustered'),
            say('narae', '아니, 얼마나 열창을 하셨길래 그래요…', 'normal'),
          ]),
          option('대의를 위해서요, 위원장님.', [
            say('byeon', '…!', 'speech'),
            say('byeon', '나래 말도 맞고 변호사 양반 말도 맞어! 애먼 사람 잡는 건 달빛마을 대의가 아니지!', 'speech'),
            say('dan', '역시 달빛마을 추진위원장님이시네요. 음성 말고 화면만 확대해서 볼게요.', 'confident'),
          ], true),
        ], 'byeon', { free: true }),
        note('변복만의 휴대폰 갤러리. 4K 원본 95초. 구만두가 해시를 떠서 임의 제출로 받는다.'),
        revise('groupVideo', '6월 13일 아침 변복만이 찍은 4K 원본(95초). 구만두가 임의 제출로 받았다.'),
        annotate('groupVideo', '[4K 원본 · 6/18] 10:14~ 확대 ① 고개를 든 얼굴, 점퍼 자수 「달빛공인중개사」 ② W3 밑에 쪼그려 앉아 래칫 렌치를 돌리는 손(40초), 양옆 연결 클램프를 떼어 봉투에 ③ 파란 천을 덮고 끈을 빨래대 기둥에 걸어 조이는 모습.'),
        say('byeon', '거 봐, 4K라 자수 실밥까지 쨍하잖여! …어? 저거 수리하는 게 아닌디?', 'flustered'),
        say('dan', '양옆 연결 클램프를 떼서 봉투에 넣고… 래칫 렌치로 밑동 너트를 풀고 있어요.', 'point'),
        say('narae', '…방수 작업이라며.', 'sad'),
        say('narae', '어제 우리 보고도 분명히 그랬잖아. 방수 양생 중이라 덮어 놓은 거라고…', 'sad'),
        think('(나래 표정이 굳었어. 동네 어른들 챙기던 아저씨가 왜 거짓말을 했는지, 눈으로 봐 버렸으니까.)'),
        think('(렌치로 돌린 건 방수포가 아니라 난간 밑동이야. 그리고 끈 하나로 아슬아슬하게 당겨 세워 놨어.)'),
        flag('d2:video4k'),
      ] },
      { id: 'evening', label: '그날 저녁', script: [
        say('dan', '한 가지만 더요. 토요일 설명회 다과 휴식 때, 경로당 강당 옆 복도도 카메라에 찍히나요?'),
        say('byeon', '찍히지. 현관 쪽 복도 카메라는 내가 직접 관리하는데. 근데 그거 일주일이면 덮어써져.', 'normal'),
        say('narae', '일주일이면 이번 주 토요일에 지워진다는 거잖아요!', 'surprised'),
        say('byeon', '걱정 마! 내일 아침 댓바람에 USB에 뽑아 가지고 법원으로 바로 갈게!', 'speech'),
        say('dan', '꼭 부탁드릴게요, 위원장님. 몇 분 몇 초에 나갔는지가 중요하거든요.', 'normal'),
        memo('변복만: 경로당 복도 CCTV(일주일 덮어쓰기)를 내일 아침 법원으로 가져온다.'),
        flag('d2:cctvAsked'),
      ] },
    ],
    presentDefault: [
      say('byeon', '글쎄, 그건 내가 아는 동네 사정하고는 거리가 먼 물건인디.', 'normal'),
    ],
  },

  // ---------------------------------------------------------------- 서울구치소 접견실
  d2visit: {
    id: 'd2visit', name: '서울구치소 접견실', bg: 'visit', bgm: 'soyoon', ambience: 'lounge', arrive: 'door',
    person: 'soyoon', connects: others('d2visit'),
    enter: [
      say('soyoon', '또 왔네요.', 'cold'),
      say('dan', '내일이 두 번째 공판이니까요. 확인해야 할 게 몇 가지 있어요.', 'normal'),
      say('narae', '…저기. 할머니가 밥은 먹냐고 물어보래.', 'sad'),
      say('soyoon', '…먹어요. 맛없게.', 'cold'),
      say('soyoon', '할머니는요. 어제 마당에서 동네 사람들한테 시달리진 않으셨어요?', 'shaken'),
      say('narae', '우리 할머니가 누군데 시달려. 눈 한 번 부라리면 다들 뒷걸음질 치지.', 'normal'),
      think('(가시 돋친 두 사람이 서로 안부를 묻는 방식치고는 꽤 진전이네.)'),
    ],
    hotspots: [],
    talks: [
      { id: 'papers', label: '원본 서류', script: [
        say('dan', '할머니 쌀독에 맡긴 서류 말이에요. 내일 법정에 꼭 필요해요.'),
        say('dan', '맡긴 분 동의부터 받아 가려고요. 그 서류를 저희에게 맡겨 주시겠어요?', 'normal'),
        say('soyoon', '…끝까지 입 다물어 주셨구나.', 'shaken'),
        say('soyoon', '…할머니한테 제가 괜찮다고 했다고 전해 주세요.', 'shaken'),
        say('soyoon', '그거 지키느라 할머니가 욕먹는 거, 더는 싫어요.', 'tears'),
        say('narae', '…전해 줄게. 토씨 하나 안 빼고.', 'sad'),
        think('(안태수 손이 닿지 않을 유일한 어른이라 믿고 맡겼던 거야. 할머니 말대로 혼자 다 지고 있었어.)'),
        flag('d2:soyoonConsent'),
      ] },
      { id: 'voice', label: '옥상에서 들은 소리', script: [
        say('dan', '소윤 씨, 첫날 접견 때 최 사장님 휴대폰에서 기계 소리가 났다고 하셨죠. 조금만 더 자세히 들려주세요.'),
        say('soyoon', '스피커로 나오던 소리였어요. 바람 때문에 웅얼웅얼, 삑 소리 사이로 "뒤로", "팔 쭉" 그런 말만.'),
        say('soyoon', '그 사람이 폰 보면서 "어, 어" 대꾸하길래 앱이 시키는 줄 알았죠.'),
        say('dan', '목소리는요? 기계가 읽는 딱딱한 톤이었나요?'),
        say('soyoon', '…낮았어요. 남자 같기도 하고. 옥상 바람 소리에 섞여서 잘 모르겠어요.', 'shaken'),
        say('soyoon', '그땐 저도 보증금 얘기로 화가 머리끝까지 나 있어서… 목소리 결까지 따질 정신이 없었어요.', 'cold'),
        think('(삑 알림음 사이로 들린 "뒤로", "팔 쭉"… 낮고 웅얼거리던 소리.)'),
        memo('소윤: 옥상의 소리는 스피커에서 나왔다. 삑 소리 사이로 "뒤로", "팔 쭉". 낮은, 남자 같은 목소리.'),
      ] },
      { id: 'shout', label: '"떨어져"', script: [
        say('dan', '배정숙 사장님이 법정에서 기억을 바로잡았어요. 난간이 먼저 흔들렸고, 그 직후에 외침을 들었다고요.'),
        say('soyoon', '난간이 기울었어요. 회색 철판이 통째로 바깥으로 꺾이길래 소리쳤어요. 난간에서 떨어지라고.', 'tears'),
        say('soyoon', '…그 말을 제일 하기 싫었던 건, 그 말이 그 사람한테 닿기 전에 그 사람이 없어졌으니까요.', 'tears'),
        say('soyoon', '됐어요, 그런 눈으로 보지 마세요. 우는 건 돈 찾고 울겠다고 했잖아요.', 'cold'),
        say('dan', '네. 내일 법정에서 그 말의 원래 뜻까지 제대로 돌려놓을게요.', 'confident'),
      ] },
    ],
    presentDefault: [
      say('soyoon', '정확하지 않은 건 말 안 해요. 그건 제가 할 말 없어요.', 'cold'),
    ],
  },

  // ---------------------------------------------------------------- 달빛 신당
  d2shrine: {
    id: 'd2shrine', name: '달빛 신당', bg: 'shrine', bgm: 'shrine', ambience: 'shrine',
    person: 'okbun', connects: others('d2shrine'),
    enter: [
      say('okbun', '왔냐.'),
      say('narae', '할머니. 왜 나한테까지 말 안 했어?', 'sad'),
      say('okbun', '맡긴 걸 지키는 게 내 일이여.'),
      say('okbun', '손녀딸 이쁘다고 입 가볍게 놀리면 신당 문 닫아야지.', 'stern'),
      say('dan', '어르신, 아침부터 골목이 소란스러웠는데 별일 없으셨어요?', 'normal'),
      say('okbun', '산 사람이 시끄럽지 신령님이 시끄럽겄냐. 마루에 앉어.', 'normal'),
    ],
    hotspots: [
      { id: 'jar', label: '쌀독', x: 30, y: 335, w: 260, h: 310, done: 'originals', ready: 'd2:soyoonConsent',
        // Once opened, later clicks get the aftermath (an `again` would also fire after a refusal).
        script: [
          when('originals', [
            say('okbun', '쌀은 다시 채워 놨다. 신령님이 굶으면 쓰나.'),
            think('(고수레 쌀독이 금고보다 백 배는 든든했네.)'),
          ], [
            when('d2:soyoonConsent', [
              say('dan', '구치소 다녀왔어요. 소윤 씨가 괜찮다고, 할머니께 꼭 전해 달래요.'),
              say('narae', '밥도 먹었대. 맛없게 먹었다고 투정은 부리던데.', 'normal'),
              say('okbun', '…그 아가씨가 그랬으면, 됐다. 밥 넘어간다니 살겄네.', 'smile'),
              note('쌀 속에서 끈으로 묶은 서류 뭉치가 나온다. 쌀알이 후드득 떨어진다.'),
              say('gu', '습기 하나 안 차고 깨끗함다. 절차대로 봉인하겠슴다.', 'serious'),
              addEvidence('originals'),
              note('서류 맨 위에 청구서 한 장. 「감정 자료 패키지 DB-0322 — 외관 촬영 고소작업 차량 25만 포함」.'),
              say('narae', '어? 맨 위 영수증에 "고소작업 차량 25만 포함"이라고 적혀 있어. 그거 사다리차잖아!', 'surprised'),
              say('dan', '건물 외관 사진을 찍는데 사다리차까지 불렀다는 뜻이네요.', 'point'),
              say('gu', '와, 밑에 수첩은 깨알같이도 적어 놨슴다. 행복하우스 말고 소망빌라에, 그 밑에 주소가 줄줄이…', 'normal'),
              say('gu', '최 사장님, 부동산 공부 꽤나 하셨나 봄다.', 'normal'),
              say('okbun', '공부는 무슨. 남 믿고 도장 찍었다가 뒤늦게 살길 찾느라 적은 글씨여.'),
              think('(오십 원짜리 못 두 개 외상도 적던 철물점 사장님 수첩이야. 내일 법정에서 꼼꼼히 대조해 봐야겠어.)'),
            ], [
              say('okbun', '그 단지는 건드리지 마라.', 'stern'),
              say('okbun', '맡긴 사람이 내놓으라 하기 전엔 경찰 할애비가 와도 안 내놔.'),
              say('narae', '거 봐, 우리 할머니 고집은 아무도 못 꺾는다니까.', 'sad'),
              think('(먼저 구치소에 가서 소윤 씨 본인의 동의부터 받아 오자.)'),
            ]),
          ]),
        ] },
      { id: 'phone', label: '나래와 앱', x: 725, y: 390, w: 180, h: 100,
        script: [
          say('narae', '할머니 신당 보상 감정, 오기로 다시 해 볼게. 이번엔 평상에 딱 앉아서 할 거야!', 'angry'),
          say('dan', '그래, 첫날처럼 화면만 보고 뒤로 걸어가다 자빠지지 말고.', 'normal'),
          app({ live: 'shrine', arrows: ['↑'], score: 41, note: '↑ 더 높이' }),
          sfx('appChime'),
          say('narae', '아, 진짜 얄미워! 팔 빠지게 위로 들어도 띡 소리만 나고 사십일 프로래!', 'angry'),
          app(null),
          say('okbun', '그 사진은 사진사 양반이 담벼락에 올라가 찍은 거여. 땅에선 평생 안 맞어.'),
          say('dan', '…어르신, 지금 뭐라고 하셨어요?', 'shock'),
          say('okbun', '처마 위에서 내려다본 그림을 마당 바닥에서 들이대니 맞을 턱이 있냐고.', 'normal'),
          think('(높은 데서 찍은 사진은… 땅에 서서는 평생 구도가 안 맞는다!)'),
          say('narae', '잠깐… 높은 데? 이 동네에서 담벼락보다 높이 올라가는 사다리차라면… 하늘 언니?!', 'surprised'),
          flag('d2:highShot'),
        ] },
    ],
    talks: [
      { id: 'why', label: '할머니와 소윤', script: [
        say('narae', '할머니는 왜 말 안 했어? 동네 사람들이 저 언니 때문에 이사 막혔다고 다 욕했잖아.', 'sad'),
        say('okbun', '네가 미워해도, 그 아가씨는 남의 돈까지 지고 다녀.'),
        say('okbun', '자기 돈만 날렸으면 벌써 울고 떠났지. 아랫집 총각네, 윗집 새댁네 돈까지 묶여서 못 우는 거여.', 'normal'),
        say('narae', '…나 그 사람 엄청 미워했는데. 눈도 안 마주치고 말도 톡톡 쏴서.', 'sad'),
        say('okbun', '미워해도 돼. 미운 건 미운 거고, 안 한 짓 뒤집어쓰는 건 별개여.', 'normal'),
        say('okbun', '그려. 풀 죽지 말고 밥은 먹어. 부엌에 시래기국 데워 놨다.', 'smile'),
        say('narae', '…응. 재판 끝나면 할머니랑 같이 먹을게.', 'sad'),
        think('(나래가 소윤 씨를 다시 보기 시작했어. 백 마디 설득보다 할머니 한마디가 깊네.)'),
      ] },
    ],
    presentDefault: [
      say('okbun', '종이는 몰라. 복잡한 글씨는 젊은 너희가 읽어야지.', 'normal'),
    ],
  },

  // ---------------------------------------------------------------- 하늘사다리 차고
  d2ladder: {
    id: 'd2ladder', name: '하늘사다리 차고', bg: 'ladderGarage', bgm: 'dalbit', ambience: 'village',
    person: 'haneul', connects: others('d2ladder'),
    enter: [
      say('haneul', '나래야! 할머니 장독 옮길 이사 날짜 잡았어?', 'cheer'),
      say('narae', '아직! 근데 언니, 오늘 우리 변호사 언니랑 꼭 물어볼 게 있어서 왔어.'),
      say('haneul', '어머, 어제 법정에 서셨던 변호사님이시죠? 저랑 우리 하늘이가 도울 일이면 다 말씀하세요!', 'cheer'),
      say('dan', '반갑습니다, 도하늘 기사님. 트럭 광택이 거울처럼 반짝이네요.', 'normal'),
      say('haneul', '헤헤, 방금 세차 끝냈거든요! 하늘이는 제 밥줄이자 동생이니까요!', 'cheer'),
      addProfile('haneul'),
    ],
    hotspots: [
      { id: 'truck', label: '하늘이', x: 345, y: 105, w: 635, h: 465,
        script: [
          say('haneul', '하늘이는 장롱 세 개, 양문형 냉장고 두 대, 할머니 간장 독까지 한 방울 안 흘리고 올려요!', 'cheer'),
          say('narae', '언니, 나도 바스켓 한 번만 태워 줘! 차고 안에서 삼 미터만!', 'happy'),
          say('dan', '나래야, 조사 중에 놀이기구 타러 온 거 아니거든?', 'sweat'),
          note('나래가 바스켓에 타고 3m쯤 올라간다.'),
          say('narae', '와하하! 단비 언니 정수리 다 보여! 어제 없던 새치 한 가닥 찾았다!', 'happy'),
          say('dan', '새치 아니야, 형광등 불빛이야! 얼른 내려와!', 'sweat'),
        ] },
    ],
    talks: [
      { id: 'customer', label: '사람 혼자 탄 손님', script: [
        say('dan', '기사님, 혹시 이삿짐 없이 건물 사진만 찍겠다고 사다리차를 부른 손님도 있었나요?'),
        say('haneul', '장롱 말고 사람 혼자 사진 찍겠다고 우리 하늘이 부른 손님은, 그 아저씨가 처음이었어요!', 'cheer'),
        say('narae', '그 아저씨라면… 누구?', 'surprised'),
        say('haneul', '달빛공인 안 사장님요! 작년… 그러니까 2030년 3월 말에 카메라 메고 타셨거든요.', 'point'),
        say('haneul', '"조금만 더 뒤로, 조금만 더 높이" 하면서 바스켓을 행복하우스 난간 밖으로 빼 달라고 했어요.', 'scared'),
        say('haneul', '허공에서 상체를 쑥 내미시는데 제 심장이 다 쫄깃했다니까요!', 'scared'),
        say('dan', '난간 밖 허공에서 어느 쪽을 보고 찍으시던가요?', 'point'),
        say('haneul', '뭘 찍었는진 몰라요. 풍경 쪽이 아니라 건물 옥상 쪽을 마주 보고 찍던데요.', 'normal'),
        say('haneul', '사람 태운 특이 작업이라 보험 때문에 아래서 현장 사진 한 장 찍어 배차 일지에 붙여 뒀어요.', 'cheer'),
        addEvidence('ladderLog'),
        say('narae', '…태수 아저씨가 왜 사다리차까지 타고 허공에서 옥상 사진을 찍었지?', 'sad'),
        think('(2030년 3월 22일, 난간 밖 허공에서 옥상 쪽을 보고… "조금만 더 뒤로".)'),
        memo('[남은 질문] 2030.3.22 바스켓에서 찍은 사진은 무엇이었나?'),
      ] },
    ],
    presentDefault: [
      say('haneul', '음… 이삿짐 바스켓에 안 실리는 건 저랑 하늘이도 잘 모르는 거예요!', 'normal'),
    ],
  },

  // ---------------------------------------------------------------- 검사실 (15:00 정한의 전화로 열림)
  d2prosecutor: {
    id: 'd2prosecutor', name: '서울중앙지검 검사실', bg: 'prosecutor', bgm: 'eom', ambience: 'clock', arrive: 'door',
    person: 'eom', requires: 'd2:call15', connects: MORNING,
    enter: [
      say('eom', '오셨군요. 피해자 휴대폰 분석이 나왔습니다. 변호인과 함께 보는 게 공정하겠죠.', 'normal'),
      say('dan', '바로 불러 주셔서 감사합니다, 엄 검사님. 숨기는 카드 없이 가시네요.', 'normal'),
      say('eom', '진실을 가리는 건 검찰의 직무가 아닙니다.', 'normal'),
      say('narae', '어? 검사님, 저 벽에 걸린 금테 액자 뭐예요? "자문 위촉"?', 'normal'),
      say('eom', '자문일 뿐입니다.', 'normal'),
      addEvidence('phoneDump'),
      say('eom', '메신저 앱은 따로 잠겨 있어 추출되지 않았습니다.'),
      say('eom', '메신저 회사에 통화 기록을 요청했고, 내일 오전엔 옵니다. 앱 운영사 자료는 오후에 도착합니다.', 'normal'),
      think('(내일 재판 도중에 기록이 차례로 도착한다는 거구나. 시간 싸움이 되겠어.)'),
    ],
    hotspots: [
      { id: 'frame', label: '액자', x: 1090, y: 45, w: 175, h: 205,
        script: [
          say('narae', '자세히 보니까 대법원 양형·판관 자문위원 위촉장이네! 검사님 이런 것도 해?', 'surprised'),
          say('eom', '오류 가능성을 지적하는 의견서를 냈더니 이름만 걸어 둔 겁니다.', 'sweat'),
          say('eom', '…자문일 뿐입니다. 두 번 묻지 마십시오.', 'sweat'),
          think('(얼음장 같은 엄 검사님 귀끝이 살짝 붉어진 걸 보니, 나래가 급소를 찔렀네.)'),
        ] },
    ],
    talks: [
      { id: 'notice', label: '집값닷AI 공지', script: [
        say('eom', '먼저 캐시에 남은 5월 20일 집값닷AI 공지입니다. 6월 14일까지 같은 구도로 다시 찍어 80%를 넘기라는 내용이죠.'),
        note('「안내는 화면과 알림음으로만 제공됩니다(음성 안내 없음).」'),
        say('narae', '…언니, 봐. 설정 문제가 아니었어. 공식 공지에도 음성 안내 없음이라고 못 박혀 있잖아!', 'surprised'),
        say('dan', '첫날 신당 마당에서 의심했던 그대로네요. 이 앱은 원래 말을 하지 않아요.', 'point'),
        think('(공식 사양까지 확인됐어. 소윤 씨가 옥상 스피커로 들은 "뒤로", "팔 쭉"은 기계가 아니라 사람의 목소리야.)'),
        memo('[확인] 집값닷AI는 공식 사양상 음성 안내가 없다. 옥상 스피커에서 난 소리는 사람의 목소리.'),
        say('eom', '하단 약관의 작은 글씨도 눈여겨보시죠. 현장 인증 클립은 영상과 음성이 서버에 30일 보관됩니다.', 'normal'),
        say('eom', '핵심은 마지막 줄입니다. 허위 자료가 한 건이라도 확인되면, 그 계정이 등록한 매물 전체가 재심사로 묶입니다.', 'normal'),
        think('(영상과 음성이 30일 보관… 그리고 허위 자료 하나가 드러나면 계정 전체가 무너진다.)'),
        flag('d2:noticeRead'),
      ] },
      { id: 'texts', label: '문자', script: [
        say('eom', '다음은 문자 기록입니다. 사건 당일인 6월 14일 16시 2분, 안태수 씨의 답장입니다.'),
        note('「사장님, 서쪽 난간은 어제 손봐 놨어요. 방수포는 끈 풀고 걷으시면 돼요. 7시 40분에 원격 지원 걸게요.」'),
        say('dan', '"서쪽 난간은 어제 손봐 놨어요"… "방수포는 끈 풀고 걷으시면 돼요". 시간까지 7시 40분으로 찍어 줬군요.', 'point'),
        say('eom', '그리고 나흘 전인 6월 10일입니다. 피해자가 월요일 법률 상담 예약 문자를 안태수 씨에게 그대로 전달했더군요.'),
        say('eom', '혼자 독박 쓰지 않겠다는 취지였고, 거기에 안태수 씨는 "백 프로 맞춰 드린다"고 답했습니다.', 'normal'),
        say('narae', '뭐야, 그렇게 큰소리 빵빵 쳐 놓고 정작 토요일엔 칠십팔에서 멈췄잖아.', 'angry'),
        say('narae', '믹스커피 타 주면서 숫자는 거짓말 안 한다더니… 뒤에선 이런 문자를 주고받았어?', 'sad'),
        think('("백 프로 맞춰 드립니다"… 빈틈없이 확인하는 사람이, 정말 맞출 수 있다고 믿고 보낸 답장이었을까?)'),
        flag('d2:textsRead'),
      ] },
      { id: 'pangwan', label: '판관의 근거', script: [
        say('eom', '판관은 피고인의 부채 비율은 소수점까지 묻는데, 증인의 사정은 묻지 않더군요.', 'normal'),
        say('dan', '검사님도 어제 법정에서 나온 그 숫자가 걸리세요?', 'normal'),
        say('eom', '통장이 비었다고 살인 동기가 채워지는 건 아니니까요.', 'normal'),
        say('eom', '걸리는 건 제 일입니다. 판단은 법정의 일이고요.', 'normal'),
        say('narae', '…엄 검사님, 생각보다 사람 냄새 나시네요.', 'normal'),
        say('eom', '칭찬으로 듣진 않겠습니다.', 'sweat'),
      ] },
    ],
    presentDefault: [
      say('eom', '해석은 증거가 다 모인 뒤에 하시죠. 그건 내일 법정에서 들으시죠.', 'normal'),
    ],
  },
};

const prosecutorDone: Script = [when('d2:noticeRead', [when('d2:textsRead', [flag('d2:prosecutorDone')])])];
DAY2_LOCATIONS.d2prosecutor.talks![0].script.push(...prosecutorDone);
DAY2_LOCATIONS.d2prosecutor.talks![1].script.push(...prosecutorDone);

const prosecutorInvestigation: Script = [
  investigate('d2prosecutor', ['d2:prosecutorDone'], [goto('day2eve')], '조사를 마친다'),
];

export const DAY2_SCENES: Record<string, Script> = {
  day2: [
    // Keep the saved phase even when the player revisits the village after the phone call.
    when('d2:call15', prosecutorInvestigation, [
      // The date card sits on the roof, not the empty courtroom (and without the court HUD).
      field('happyRoofW'),
      place('6월 18일 수요일', '오전 6시 50분', '행복하우스 옥상'),
      investigate('d2roof', DAY2_GOALS, [
        sfx('phone'),
        place('6월 18일 수요일', '오후 3시'),
        sayAs('eom', '전화 속 엄정한', '변호인. 피해자 휴대폰 분석이 나왔습니다. 검사실로 오시겠습니까.'),
        say('dan', '기다리고 있었습니다, 검사님. 지금 바로 서초동으로 갈게요.', 'point'),
        say('narae', '언니, 가자! 최 사장님 폰 안에 뭐가 남았는지 직접 봐야겠어.', 'normal'),
        flag('d2:call15'),
        ...prosecutorInvestigation,
      ], '조사를 마친다'),
    ]),
  ],

  day2eve: [
    fadeOut,
    place('6월 18일 수요일', '저녁 7시'),
    sfx('phone'),
    sayAs('eom', '전화 속 엄정한', '1일차에 요청한 홈캠 원본이 왔습니다. 발췌 밖에, 이게 있더군요.'),
    say('dan', '파일 전송받았어요. 고맙습니다, 검사님. 내일 법정에서 뵙겠습니다.', 'normal'),
    annotate('homecam', '[원본 전체 · 6/18 정한 개시] 19:30 피해자가 금고에서 서류를 책상 봉투로 → 19:51 피고인이 봉투를 들고 나감 → 20:14 안태수가 들어와 곧장 금고·책상으로 → 20:21 프린터 출력 → 그 뒤로도 서랍·책상 밑·휴지통·소파 틈을 뒤진다(~20:31).'),
    revise('homecam', '피해자 사무실의 블루투스 스피커 속 카메라. 원본 전체(19:20~20:40).'),
    flag('d2:homecamFull'),
    say('narae', '사람 떨어지고 삼십 분도 안 됐는데… 뭘 찾는 거야, 저거?', 'surprised'),
    say('dan', '들어오자마자 망설임 없이 금고랑 책상부터 열었어. 소파 틈이랑 휴지통까지 십 분 넘게 뒤지고 있고.', 'point'),
    say('narae', '동네 어르신들 놀라실까 봐 수습하러 다녔다면서… 다 거짓말이었어?', 'sad'),
    think('(소윤 씨가 19시 51분에 봉투를 들고 나가지 않았다면, 저 서류 뭉치는 20시 14분에 영영 사라졌을 거야.)'),
    place('6월 18일 수요일', '저녁 7시 45분', '행복하우스 옥상'),
    field('happyRoof', true),
    tint('dusk'),
    ambience('village'),
    bgm('dusk'),
    fadeIn,
    note('봉인된 W3 자리 앞. 동북동으로 정숙세탁 간판틀이 노을을 가린다.'),
    think('(이 옥상에서는… 남산이 안 보인다.)'),
    say('narae', '언니, 바람 차다. 할머니가 밥 먹고 싸우래.'),
    say('narae', '나 사람 보는 눈 진짜 없나 봐. 말투 다정하다고 동네에서 제일 좋은 어른인 줄 알았는데.', 'sad'),
    say('dan', '네 눈이 이상한 게 아니야. 원래 믿게 만드는 말투가 제일 무서운 법이거든.', 'normal'),
    say('dan', '…내일은 지면 안 되겠다.'),
    say('narae', '그 여자 무죄 되면, 할머니 이사 더 늦어지려나.', 'sad'),
    say('dan', '그건 그거고.'),
    say('narae', '알아. 그건 그거고.'),
    say('narae', '가자, 언니. 할머니가 데워 놓은 시래기국 식겠다.', 'normal'),
    wait(400),
    fadeOut,
    tint(null),
    field(null),
    ambience(null),
    goto('lobby2'),
  ],
};

guideDayTwo(DAY2_LOCATIONS);
