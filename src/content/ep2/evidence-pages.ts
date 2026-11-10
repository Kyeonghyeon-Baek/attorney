import { PLATES } from '../../engine/plates';
import type { Evidence } from '../../engine/types';
import { EP2_DIAGRAMS } from './diagrams';

// The episode's schematic plates join the shared lookup only when this (dev-only) episode loads.
Object.assign(PLATES, EP2_DIAGRAMS);

// 2화 evidence as compact cards: each record's short summary (two or three lines on screen) and
// the full-screen pages its source material is read on (engine/evidence-view.ts). The text is the
// original record's, regrouped by page; `detail` in records.ts stays the original wording.
//
// Pages with `tab` are the presentable parts; their lock comes from the tab's `requires`. Later
// findings (annotate) land on the page whose `addenda` prefix they start with.
// Photo pages name a painted photo `image` (src/assets/ep2/photos/<image>.png, dev-only); while it is
// missing, the plate drawing or the item art stands in.

type Card = Pick<Evidence, 'summary' | 'pages' | 'cover'>;

export const EVIDENCE_CARDS: Record<string, Card> = {
  roofScene: {
    summary: '떨어진 밝은 회색 W3 패널(바깥면 표지판·뒷면 볼트 넷)과 너트 없는 앵커 볼트 넷, 풀린 끈·방수포.',
    pages: [
      {
        id: 'alley', kind: 'photo', title: '[골목] 떨어진 W3 패널', image: 'roof-alley-w3',
        lines: ['다른 칸보다 밝은 회색 패널.', '바깥면: 표지판 「행복하우스 · 달빛로12길 7」'],
      },
      {
        id: 'alleyBack', kind: 'photo', title: '[골목] W3 패널 뒷면 (도식)', plate: 'diagW3Back',
        lines: ['뒷면: 볼트 머리 넷.', '※ 바깥면 주소판 네 모서리를 고정한 볼트다. 아래 밑판 고정부(앵커 볼트 구멍)와는 다른 부분.'],
      },
      {
        id: 'parapet', kind: 'photo', title: '[옥상] W3 자리 파라펫', image: 'roof-parapet-w3',
        lines: ['W3 자리 파라펫 위로 앵커 볼트 넷만 솟아 있다.', '너트가 없다.'],
      },
      {
        id: 'floor', kind: 'photo', title: '[옥상] W3 앞 바닥', image: 'roof-floor-w3',
        lines: [
          '풀린 래칫 끈과 걷힌 파란 방수포.',
          '끈 한쪽은 빨래대 기둥에 묶인 채.',
          '넘어진 팻말 「방수 양생 중 · 출입 금지」.',
          '※ 팻말은 엎어져 있어 사진에는 뒷면이 보인다.',
        ],
      },
      {
        id: 'tie', kind: 'photo', title: '[옥상] W2 끝', image: 'roof-w2-tie',
        lines: ['W2 끝에 노란 케이블타이 토막 하나.'],
      },
    ],
  },
  postmortem: {
    summary: '추락사. 등 아래에 난간 높이의 가로 멍, 몸 앞쪽엔 밀친 흔적이 없다. 오른 소매가 찢어졌다.',
    pages: [
      {
        id: 'p1', kind: 'photo', title: '[1쪽] 검시 소견', plate: 'diagBody', addenda: ['[2쪽'],
        lines: [
          '등 아래 가로 띠 모양 멍. 높이는 난간 상단과 같다.',
          '몸 앞쪽엔 밀친 흔적·방어흔 없음.',
          '오른 소매 솔기가 찢어짐.',
        ],
      },
    ],
  },
  phoneScreen: {
    summary: '반투명 사진이 겹친 앱 화면. 화살표 ←·↑, 「일치율 78% · 2% 부족」, 「원격 지원 중」 배지.',
    pages: [
      {
        id: 'screen', kind: 'photo', title: '마지막 화면', cg: 'phone-crack',
        lines: [
          '금 간 화면에 반투명 사진이 겹쳐 있다. 화살표 ←, ↑.',
          '「일치율 78% · 2% 부족」',
          '왼쪽 위 작은 배지 「원격 지원 중」.',
        ],
      },
    ],
  },
  firstStatement: {
    summary: '사건 직후 목격 진술. 손 들고 뒷걸음 → 난간 휘청 → 여자 팔 뻗음 → 남자 없어짐·"떨어져" 순서.',
    pages: [
      {
        id: 'memo', kind: 'document', title: '경찰 수첩 메모',
        caption: '6/14 20:03 정숙세탁 배정숙(56) 진술. 경찰 수첩 손글씨 그대로.',
        lines: [
          '① 남자가 두 손 들고 뒷걸음질',
          '② 난간 휘청',
          '③ 여자가 튀어나와 팔 뻗음',
          '④ 남자 없어짐 · 여자가 "떨어져"',
        ],
      },
    ],
  },
  dalbitMap: {
    summary: '행복하우스와 정숙세탁(동북동 맞은편), 신당·경로당·중개사무소 위치를 그린 동네 지도.',
    pages: [
      {
        id: 'village', kind: 'map', title: '[마을] 동네 지도', tab: 'village', map: 'village',
        lines: ['행복하우스 · 정숙세탁(길 건너 동북동, 땅이 4m 높은 5층) · 신당 · 경로당 · 중개사무소 · 고철 컨테이너.'],
      },
      {
        id: 'roof', kind: 'map', title: '[옥상] 평면·단면', tab: 'roof', map: 'happyRoof', addenda: ['[옥상'],
        lines: [
          '서쪽 난간 W1~W4. W3만 보수 패널.',
          '빨래대 기둥은 W3에서 안쪽으로 약 2.5m.',
          '난간 1.1m · 옥탑 2.6m · 물탱크 3.9m.',
        ],
      },
      { id: 'window', kind: 'photo', title: '[창에서 본 옥상] 4층 창 재현', tab: 'window', plate: 'diagWindow', addenda: ['[창에서 본 옥상'] },
      { id: 'sign', kind: 'photo', title: '[간판틀] 정숙세탁 간판 높이', tab: 'sign', plate: 'diagSign', addenda: ['[간판틀'] },
    ],
  },
  roofDoorLog: {
    summary: '옥상 도어락 기록(6/14 20:21 출력). 6/11 임시 코드 #7, 6/13 마스터·세입자 출입.',
    pages: [
      {
        id: 'log', kind: 'table', title: '출입 기록 출력본',
        table: {
          head: ['날짜', '시각', '열린 방법'],
          rows: [
            ['5/24', '16:05', '관리 마스터 카드'],
            ['6/11', '14:52', '임시 코드 #7'],
            ['6/12', '07:10', '세입자 공용 코드'],
            ['6/13', '10:14', '관리 마스터 카드'],
            ['6/13', '14:58', '세입자 공용 코드'],
            ['6/14', '07:20', '세입자 공용 코드'],
            ['6/14', '19:38', '소유주 코드'],
            ['6/14', '19:44', '세입자 공용 코드'],
          ],
        },
        lines: ['※ 바닥글: 출력 2031-06-14 20:21 (관리 대행 달빛공인중개사)'],
      },
    ],
  },
  appraisal: {
    summary: '행복하우스 감정서(20억 3천). 남산 조망 사진(+1억 6천)과 201·302호 실내 사진이 실려 있다.',
    cover: { plate: 'namsan' },
    pages: [
      {
        id: 'summary', kind: 'document', title: '[요약] 감정가 내역', tab: 'summary',
        table: {
          head: ['항목', '금액', '근거'],
          rows: [
            ['비교 사례', '17억 6천', ''],
            ['상태 가산', '1억 1천', ''],
            ['조망 가산', '1억 6천', '"옥상 남산 조망"'],
            ['감정가', '20억 3천', ''],
          ],
        },
        lines: ['※ 바닥글: 자료 등록 · 달빛공인중개사'],
      },
      {
        id: 'rooms201', kind: 'photo', title: '[세대 사진] 201호', tab: 'rooms', plate: 'room201',
        lines: ['감정 리포트에 실린 201호 사진(거실·주방).'],
      },
      {
        id: 'rooms302', kind: 'photo', title: '[세대 사진] 302호', tab: 'rooms', plate: 'room302fake',
        lines: ['감정 리포트에 실린 302호 사진(거실·주방).'],
      },
      {
        id: 'namsan', kind: 'photo', title: '[조망 사진] 남산', tab: 'namsan', plate: 'namsan',
        lines: [
          '맑은 낮 하늘과 남산 타워.',
          '왼쪽에 옥탑, 앞에 이웃 건물 간판틀.',
          '맨 아래 난간 윗부분과 표지판.',
        ],
      },
    ],
  },
  groupVideo: {
    summary: '6/13 아침 변복만이 올린 15초 압축본. 남색 점퍼가 W3 앞에서 파란 천을 편다. 얼굴·손은 뭉개졌다.',
    pages: [
      {
        id: 'compressed', kind: 'frames', title: '[압축본] 단톡 15초',
        frames: [{ at: '15초', text: '남색 점퍼가 W3 앞에서 몸을 숙이고 파란 천을 펼친다. 얼굴·손은 뭉개져 안 보인다.' }],
        lines: ['캡션: "우리 관리소장님 아침부터 안전 점검 👍"'],
      },
      {
        id: 'original', kind: 'frames', title: '[4K 원본] 확대', requires: 'd2:video4k',
        addenda: ['[4K 원본'],
        caption: '변복만의 휴대폰 갤러리에 있던 4K 원본(95초). 구만두가 임의 제출로 받았다.',
      },
    ],
  },
  snsPost: {
    summary: '6/10 밤 피고인이 올린 "죽여 버리고 싶다" 글. 귀퉁이에 「6/14 20:02 제보 · 안태수」 도장.',
    pages: [
      {
        id: 'post', kind: 'document', title: '게시물 출력본',
        lines: [
          '6/10 23:40  "이 집주인 진짜 죽여 버리고 싶다 #전세사기"',
          '※ 귀퉁이 경찰 접수 도장: 「6/14 20:02 제보 · 관리 대행 안태수」',
        ],
      },
    ],
  },
  call119: {
    summary: '추락 직후 피고인의 119 신고 녹음과 자막. 「[불명확 0.6초] 떨어지라고 했는데」 구간이 있다.',
    pages: [
      {
        id: 'transcript', kind: 'document', title: '자동 받아쓰기', addenda: ['[6/17'],
        lines: [
          '19:47:05  "사람이… 사람이 떨어졌어요!"',
          '19:47:18  "[불명확 0.6초] 떨어지라고, 떨어지라고 했는데…"',
          '19:47:24  "앱이, 앱이 뒤로 가라고 해서… 뒤로 넘어갔어요…"',
        ],
      },
    ],
  },
  homecam: {
    summary: '관리사무실 스피커 카메라의 경찰 발췌본. 19:51 피고인이 책상 위 서류 봉투를 들고 나간다.',
    pages: [
      {
        id: 'excerpt', kind: 'frames', title: '[경찰 발췌본]',
        frames: [{ at: '19:51', text: '피고인이 책상 위 서류 봉투를 들고 나간다.' }],
      },
      {
        id: 'full', kind: 'frames', title: '[원본 전체] 19:20~20:40', requires: 'd2:homecamFull',
        addenda: ['[원본 전체'],
        caption: '6/18 저녁 검찰이 넘겨준 원본 전체.',
      },
    ],
  },
  moveInPhoto: {
    summary: '피고인이 입주 날(2030.5.2) 찍은 302호. 감정서 302호 사진과 같은 구도, 소화기·인터폰.',
    pages: [
      {
        id: 'photo', kind: 'photo', title: '302호 입주 사진', plate: 'room302real',
        lines: ['감정 리포트의 302호 사진과 같은 구도.', '소화기 · 인터폰.'],
      },
    ],
  },
  inspection: {
    summary: '6/11 점검표와 문자. "사람이 기대면 넘어갈 수 있어요" 경고에 "제가 통제하겠습니다" 답장.',
    pages: [
      {
        id: 'sheet', kind: 'document', title: '[점검표] 6월 11일',
        lines: [
          'W3 밑판 앵커 부식 · 연결부 헐거움.',
          '→ 노란 임시 클램프(볼트 캡 「튼튼」) · 노란 경고 테이프 설치.',
        ],
      },
      {
        id: 'warning', kind: 'messages', title: '[메시지] 윤철주 → 달빛공인중개사',
        messages: [
          { at: '16:22', from: '윤철주', text: '사람이 기대면 넘어갈 수 있어요. 즉시 교체 요망.', mine: true },
          { at: '16:40', from: '달빛공인중개사', text: '제가 통제하겠습니다.', note: '읽음' },
        ],
      },
    ],
  },
  looseParts: {
    summary: '옥상 서쪽 난간에서 풀려 나온 부품. 찾은 곳마다 칸이 채워진다.',
    pages: [
      { id: 'laundry', kind: 'photo', title: '[세탁소] 점퍼 안감의 너트', tab: 'laundry', plate: 'diagPartsLaundry', addenda: ['[세탁소]'] },
      { id: 'bin', kind: 'photo', title: '[컨테이너] 전단 봉투', tab: 'bin', plate: 'diagPartsBin', addenda: ['[컨테이너]'] },
    ],
  },
  originals: {
    summary: '쌀독에서 회수한 원본 서류. 14억 해제 합의서, 달빛공인 청구서(고소작업 차량 25만), 피해자 장부.',
    pages: [
      { id: 'contract', kind: 'document', title: '[이중계약서]', lines: ['행복하우스 매입 관련.'] },
      {
        id: 'release', kind: 'document', title: '[해제 합의서] 14억 거래', tab: 'release',
        lines: ['옆 빌라 14억 거래(2030.02 해제).', '매수인 이름은 다른 사람.', '매수인 연락처 010-2030-1004.'],
      },
      {
        id: 'invoice', kind: 'document', title: '[청구서] 감정 자료 패키지', tab: 'invoice',
        lines: ['발행: 달빛공인중개사.', '「감정 자료 패키지 DB-0322 — 외관 촬영 고소작업 차량 25만 포함 380만」'],
      },
      {
        id: 'ledger', kind: 'document', title: '[장부] 안가 패키지', tab: 'ledger',
        lines: [
          '"2030.03.22 외관 촬영 차량비 25만"',
          '마지막 장 "안가 패키지": DB-0322 행복하우스 · DB-0407 소망빌라 · 그 아래 네 줄(주소·패키지 번호).',
        ],
      },
    ],
  },
  ladderLog: {
    summary: '2030.3.22 행복하우스 서측 작업 일지와 사진. 난간 밖 1.2m 바스켓에서 휴대폰을 옥상 쪽으로.',
    pages: [
      {
        id: 'log', kind: 'document', title: '[작업 일지] 2030.03.22',
        table: {
          head: ['항목', '기록'],
          rows: [
            ['현장', '행복하우스 서측'],
            ['작업', '외관 촬영 보조'],
            ['탑승', '바스켓 1인'],
            ['위치', '서측 난간 외측 1.2m · 바스켓 +2.2m'],
            ['시간', '14:00~15:30'],
          ],
        },
      },
      {
        id: 'photo', kind: 'photo', title: '[보험용 사진]', image: 'ladder-basket',
        lines: ['골목에서 올려다본 바스켓.', '남색 점퍼가 휴대폰을 세로로 들고 옥상 쪽을 향한다.', '아래에 표지판 앞면.'],
      },
      {
        id: 'position', kind: 'photo', title: '[일지 기록] 바스켓 위치 (도식)', plate: 'diagBasket',
        lines: ['일지에 적힌 위치: 서측 난간 외측 1.2m, 바스켓 +2.2m.'],
      },
    ],
  },
  phoneDump: {
    summary: '피해자 폰의 6/10·6/14 문자, 관리 앱 보고, 집값닷AI 재인증 공지와 화면 보기 기록.',
    pages: [
      {
        id: 'texts0527', kind: 'messages', title: '[문자] 5월 27일',
        messages: [{ at: '5/27', from: '안태수', text: '3층 누수 처리 완료했습니다. 사진 첨부합니다. 다음 주 화요일 정화조 청소 일정 있습니다.' }],
      },
      {
        id: 'texts0610', kind: 'messages', title: '[문자] 6월 10일 밤', tab: 'texts0610',
        messages: [
          { at: '6/10 21:38', from: '최봉구 (전달)', mine: true, text: '[법무법인 한결] 6/16(월) 10:00 형사 상담 예약 완료 (본인 가담 및 공동 가담자 관련)' },
          { at: '6/10 21:39', from: '최봉구', mine: true, text: '안 소장 아까 말한 대로다.. 토요일까지 재인증 안 되면 월요일 아침에 금고 원본 다 싸 들고 여기 간다 나 혼자 독박 안 써' },
          { at: '6/10 21:52', from: '안태수', note: '읽음', text: '아이고 사장님, 맘 푸시고 예약부터 취소하셔요. 토요일에 제가 원격 붙어서 백 프로 맞춰 드립니다. 걱정 마시고 발 뻗고 주무세요.' },
        ],
      },
      {
        id: 'texts0614', kind: 'messages', title: '[문자] 6월 14일 오후', tab: 'texts0614',
        messages: [
          { at: '6/14 15:58', from: '최봉구', mine: true, text: '재인증 그거 오늘까지라며. 어디서 찍어야 돼? 나 그런 거 잘 몰라.' },
          { at: '6/14 16:02', from: '안태수', text: '사장님, 서쪽 난간은 어제 손봐 놨어요. 방수포는 끈 풀고 걷으시면 돼요. 7시 40분에 원격 지원 걸게요. 해 지기 직전이 조망 인식 제일 잘 돼요. 옥상 올라가 계세요.' },
        ],
      },
      {
        id: 'mgmt', kind: 'table', title: '[관리 앱] 보수 완료', tab: 'mgmt',
        table: {
          head: ['날짜', '항목'],
          rows: [
            ['6/11', '점검 지적 「W3 즉시 교체」'],
            ['6/13 10:40', '「[작업 보고] 옥상 서쪽 난간 · 보수 완료」'],
          ],
        },
      },
      {
        id: 'notice', kind: 'document', title: '[공지] 재인증 안내', tab: 'notice',
        lines: [
          '5/20 집값닷AI 재인증 공지',
          '6/14 24시까지 같은 구도로 다시 촬영, 일치율 80% 이상.',
          '"안내는 화면과 알림음으로만 제공됩니다(음성 안내 없음)."',
        ],
      },
      {
        id: 'fine', kind: 'document', title: '[공지·작은 글씨] 촬영 조건·재심사', tab: 'fine',
        lines: [
          '"현장 인증 클립(영상·음성)은 부정 방지를 위해 30일간 보관됩니다."',
          '"해당 공간에 서서 촬영한 것만 인정합니다(기기 고도 기록 확인, 외부 장비·고소작업 차량 촬영 제외)."',
          '"등록 자료가 허위로 확인되면 그 자료를 등록한 계정의 모든 매물을 재심사합니다."',
        ],
      },
      {
        id: 'alerts', kind: 'document', title: '[알림] 화면 보기 시작·종료', tab: 'alerts',
        lines: [
          '19:42:05  "달빛공인중개사가 화면 보기를 시작했습니다"',
          '19:46:41  "화면 보기 종료"',
          '[세션 캐시]',
          '19:43:12  66% → ↑ ↑ ↑ 76% → 78% "2% 부족 · ← 뒤로"',
        ],
      },
      { id: 'messenger', kind: 'document', title: '[메신저 회신] 보이스톡 기록', tab: 'messenger', addenda: ['[메신저 회신'] },
    ],
  },
  hallCctv: {
    summary: '19:41~48 경로당 복도 무음 영상. 안태수가 폰에 대고 말하다 46분 41초 화면을 누르고 돌아간다.',
    pages: [
      {
        id: 'timeline', kind: 'frames', title: '복도 CCTV 주요 장면',
        frames: [
          { at: '19:41:30', text: '안태수가 강당에서 복도로 나온다.' },
          { at: '19:41~46', text: '휴대폰 화면을 보며 휴대폰을 입가에 대고 여러 번 말한다.' },
          { at: '19:46:38', text: '말을 멈추고 화면을 본 채 굳는다.' },
          { at: '19:46:41', text: '화면을 누른다. 휴대폰을 주머니에 넣고 머리를 쓸어 넘긴다.' },
          { at: '19:47:10', text: '웃으며 강당으로 돌아간다.' },
        ],
      },
    ],
  },
  railReport: {
    summary: '구조 감정. 고정이 풀린 W3가 기록된 자세의 하중으로 바깥으로 넘어갔다. 끈 고리엔 W3 페인트.',
    cover: { figure: 'rail' },
    pages: [
      {
        id: 'conclusion', kind: 'figure', title: '[결론] 구조도', figure: 'rail',
        lines: ['고정이 해제된 상태에서, 기록된 자세의 하중으로 바깥으로 넘어갔다. 정상 고정이었다면 넘어가지 않는다.'],
      },
      {
        id: 'strap', kind: 'document', title: '[끈] 래칫 끈 감정',
        lines: [
          '빨래대 쪽 고리, 반대쪽 고리에 W3와 같은 밝은 회색 페인트.',
          '래칫 레버는 젖혀져 있다.',
          '방수포 구멍엔 끈이 걸렸던 흔적이 없다.',
        ],
      },
    ],
  },
  serverReply: {
    summary: '추락 직전 12초간의 현장 인증 클립(영상·기기 마이크 음성·프레임 5장)과 운영사 서버 기록.',
    cover: { plate: 'clip31' },
    pages: [
      {
        id: 'clip', kind: 'frames', title: '[인증 클립] 마지막 12초', tab: 'clip', plate: 'clip31',
        caption: '19:46:27~38, 12초. 영상과 기기 마이크 소리 그대로.',
        lines: [
          '19:46:27  (바람) (삑)',
          '19:46:28  한소윤: "사장님, 지금 사진 찍을 때예요?!"',
          '19:46:30  스피커 속 목소리: "…다 왔어요."',
          '19:46:31  (삑)',
          '19:46:32  스피커 속 목소리: "…조금만 더 뒤로요, 사장님."',
          '19:46:34  (끼익—)',
          '19:46:35  한소윤: "난간에서 떨어져!"',
          '19:46:38  (하늘. 바람 소리.)',
          '※ "클립 음성은 기기 마이크에 들린 주변 소리(스피커 출력 포함)입니다."',
        ],
      },
      {
        id: 'frames', kind: 'frames', title: '[인증 클립] 프레임', tab: 'frames',
        frames: [
          { at: '19:46:31', text: '인증 클립 31초', plate: 'clip31' },
          { at: '19:46:33', text: '인증 클립 33초', plate: 'clip33' },
          { at: '19:46:35', text: '인증 클립 35초', plate: 'clip35' },
          { at: '19:46:37', text: '인증 클립 37초', plate: 'clip37' },
          { at: '19:46:38', text: '인증 클립 38초', plate: 'clip38' },
        ],
      },
      {
        id: 'account', kind: 'document', title: '[계정 기록] 등록 매물 · 원격 지원', tab: 'account', plate: 'namsan',
        lines: [
          '달빛공인중개사 계정: 등록 매물 23건(달빛마을).',
          '행복하우스 기준 사진: 감정 리포트와 같은 파일, 촬영 2030.03.22 14:41.',
          '6/14 19:42:05~19:46:41 중개사 원격 지원(화면 공유, 음성 없음).',
        ],
      },
      {
        id: 'practice', kind: 'table', title: '[계정 기록] 5/24 연습 인증', tab: 'practice',
        table: { head: ['날짜', '시각', '기록'], rows: [['5/24', '16:07~16:19', '연습 인증 9회, 최고 79% "1% 부족 · ← 뒤로"']] },
      },
      {
        id: 'deleted', kind: 'table', title: '[계정 기록] 6/14 21:40 삭제', tab: 'deleted',
        table: { head: ['날짜', '시각', '기록'], rows: [['6/14', '21:40', '기준 사진 삭제 · 조망 가산 비활성화']] },
      },
    ],
  },
};
