import type { Plate } from '../../engine/plates';

// 2화 explanatory diagrams for the evidence detail pages, drawn in code so their labels, counts and
// measurements are exact (records.ts and docs/ep2/case-truth.md). They are schematic, never passed
// off as photos, and live with the episode's content.
// 1280×720 stage coordinates, like every plate.

const W = 1280;
const H = 720;
const PAPER = '#f4f0e6';
const INK = '#1e2433';
const RED = '#b83a3a';
const BLUE = '#2b3a73';
const GREY = '#c9ccd1';

const text = (x: number, y: number, s: string, size = 26, fill = INK, anchor = 'middle', weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${s}</text>`;
const frame = (title: string) =>
  `<rect width="${W}" height="${H}" fill="${PAPER}"/>${text(40, 56, title, 30, BLUE, 'start', 700)}` +
  `<line x1="40" y1="74" x2="${W - 40}" y2="74" stroke="${BLUE}" stroke-width="2"/>` +
  text(W - 40, 56, '도식 · 실측·기록 기준', 18, '#6b5f4a', 'end');
const arrowDefs = `<defs><marker id="dg-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${INK}"/></marker></defs>`;
const dim = (x1: number, y1: number, x2: number, y2: number) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="2" marker-start="url(#dg-arr)" marker-end="url(#dg-arr)"/>`;
const bolt = (x: number, y: number) =>
  `<g><polygon points="${x - 16},${y} ${x - 8},${y - 14} ${x + 8},${y - 14} ${x + 16},${y} ${x + 8},${y + 14} ${x - 8},${y + 14}" fill="#7d838b" stroke="#40444a" stroke-width="3"/><circle cx="${x}" cy="${y}" r="5" fill="#40444a"/></g>`;
const nut = (x: number, y: number) =>
  `<g><polygon points="${x - 20},${y} ${x - 10},${y - 17} ${x + 10},${y - 17} ${x + 20},${y} ${x + 10},${y + 17} ${x - 10},${y + 17}" fill="#9a5b2e" stroke="#5a3418" stroke-width="3"/><circle cx="${x}" cy="${y}" r="8" fill="${PAPER}" stroke="#5a3418" stroke-width="2"/></g>`;

// The fallen panel seen from the roof side. The four heads are the address sign's fasteners, at the
// corners of the plate on the outer face (centred, so they sit at the same place from behind); the
// mounting feet with their anchor holes are a separate part. No lettering shows from this side.
const W3_BACK = `${frame('W3 패널 뒷면 (옥상 쪽)')}
  <rect x="140" y="130" width="1000" height="340" rx="4" fill="${GREY}" stroke="#7d838b" stroke-width="10"/>
  <rect x="470" y="200" width="340" height="140" fill="none" stroke="#8a9098" stroke-width="2" stroke-dasharray="10 8"/>
  ${bolt(484, 214)}${bolt(796, 214)}${bolt(484, 326)}${bolt(796, 326)}
  ${text(640, 278, '글씨 없음', 24, '#555b63')}
  ${text(640, 400, '바깥면 표지판의 고정 볼트 머리 넷', 28, RED, 'middle', 700)}
  ${text(640, 434, '(점선: 반대쪽 면에 붙은 주소판 자리)', 20, '#6b5f4a')}
  <rect x="190" y="470" width="90" height="46" fill="${GREY}" stroke="#7d838b" stroke-width="4"/>
  <circle cx="218" cy="493" r="8" fill="${PAPER}" stroke="#40444a" stroke-width="3"/><circle cx="252" cy="493" r="8" fill="${PAPER}" stroke="#40444a" stroke-width="3"/>
  <rect x="1000" y="470" width="90" height="46" fill="${GREY}" stroke="#7d838b" stroke-width="4"/>
  <circle cx="1028" cy="493" r="8" fill="${PAPER}" stroke="#40444a" stroke-width="3"/><circle cx="1062" cy="493" r="8" fill="${PAPER}" stroke="#40444a" stroke-width="3"/>
  ${text(640, 560, '아래 양쪽: 밑판 고정부 (앵커 볼트 구멍 넷) — 표지판 볼트와는 다른 부분', 22, INK)}
  ${text(640, 620, '바깥면(골목 쪽)에는 표지판 「행복하우스 · 달빛로12길 7」 (사진 1)', 22, '#6b5f4a')}`;

// Window reconstruction (6/16): window → the person in front → W3 nearly in one line, low sun behind.
const WINDOW = `${frame('4층 창에서 본 옥상 · 6/16 재현')}${arrowDefs}
  <rect x="0" y="560" width="${W}" height="160" fill="#ddd6c4"/>
  <rect x="60" y="360" width="560" height="200" fill="#b9b2a2"/>${text(340, 500, '행복하우스 옥상', 26)}
  <rect x="80" y="300" width="14" height="60" fill="#7d838b"/>${text(80, 400, 'W3 (서쪽 난간)', 20, INK, 'start')}
  <rect x="960" y="140" width="250" height="420" fill="#b9b2a2"/>${text(1085, 530, '정숙세탁', 26)}
  <rect x="975" y="250" width="70" height="60" fill="#7fb2d8" stroke="${INK}" stroke-width="3"/>${text(1010, 240, '4층 창', 22)}
  <g fill="${INK}"><circle cx="125" cy="276" r="14"/><rect x="113" y="290" width="24" height="70"/></g>${text(100, 235, '뒤에 선 사람 (W3 앞)', 20, RED, 'start')}
  <g fill="${INK}"><circle cx="340" cy="270" r="17"/><rect x="325" y="287" width="30" height="73"/></g>${text(340, 200, '앞에 선 사람 (그 앞 2m)', 20, RED)}
  <line x1="1000" y1="280" x2="110" y2="288" stroke="${RED}" stroke-width="3" stroke-dasharray="14 10"/>
  ${text(680, 262, '시선이 거의 한 줄 → 앞사람 실루엣에 뒷사람이 거의 다 가려진다', 22, RED)}
  <circle cx="34" cy="150" r="22" fill="#f2a33a"/>${text(66, 158, '해: 서북서 · 고도 4° (19:46, 역광)', 20, '#8a5a10', 'start')}
  ${text(640, 650, '※ 위치 관계를 보인 도식. 거리·높이 비율은 실제와 다르다.', 20, '#6b5f4a')}`;

// Survey (6/18): the laundry's rooftop sign frame from the Happy House roof.
const SIGN = `${frame('정숙세탁 옥상 간판틀 · 6/18 구만두 측량')}${arrowDefs}
  <rect x="80" y="520" width="380" height="200" fill="#b9b2a2"/>${text(270, 600, '행복하우스 옥상 바닥 (기준 0m)', 22)}
  <rect x="80" y="486" width="10" height="34" fill="#7d838b"/>${text(140, 478, '난간 1.1m', 18)}
  <rect x="860" y="300" width="340" height="420" fill="#b9b2a2"/>${text(1030, 560, '정숙세탁 (땅이 4m 높은 5층)', 22)}
  <rect x="880" y="200" width="300" height="100" fill="none" stroke="${INK}" stroke-width="6"/>
  <path d="M880 200 L1180 300 M1180 200 L880 300" stroke="${INK}" stroke-width="3"/>${text(1030, 186, '옥상 간판틀', 22)}
  <line x1="460" y1="520" x2="860" y2="520" stroke="${BLUE}" stroke-width="2" stroke-dasharray="8 8"/>
  <line x1="460" y1="200" x2="880" y2="200" stroke="${BLUE}" stroke-width="2" stroke-dasharray="8 8"/>
  ${dim(800, 205, 800, 515)}${text(790, 370, '+7.7m', 30, RED, 'end', 700)}
  ${dim(465, 640, 855, 640)}${text(660, 628, '동북동 약 34m', 28, RED, 'middle', 700)}
  ${text(640, 700, '※ 간판틀 윗선 높이는 행복하우스 옥상 바닥 기준. 도식의 비율은 실제와 다르다.', 18, '#6b5f4a')}`;

// Postmortem page 1: where the marks are, back and front.
const figure = (x: number) => `
  <circle cx="${x}" cy="170" r="42" fill="#e6dccb" stroke="${INK}" stroke-width="3"/>
  <path d="M${x - 80} 220 Q${x} 200 ${x + 80} 220 L${x + 90} 470 L${x - 90} 470 Z" fill="#e6dccb" stroke="${INK}" stroke-width="3"/>
  <path d="M${x - 80} 225 L${x - 130} 430 L${x - 105} 438 L${x - 62} 260 Z" fill="#e6dccb" stroke="${INK}" stroke-width="3"/>
  <path d="M${x + 80} 225 L${x + 130} 430 L${x + 105} 438 L${x + 62} 260 Z" fill="#e6dccb" stroke="${INK}" stroke-width="3"/>
  <rect x="${x - 85}" y="470" width="75" height="200" fill="#e6dccb" stroke="${INK}" stroke-width="3"/>
  <rect x="${x + 10}" y="470" width="75" height="200" fill="#e6dccb" stroke="${INK}" stroke-width="3"/>`;
const BODY = `${frame('검시 소견 1쪽 · 흔적 위치')}
  ${figure(360)}${text(360, 110, '뒤', 26, BLUE, 'middle', 700)}
  <rect x="275" y="400" width="170" height="26" rx="6" fill="${RED}" opacity="0.75"/>
  <line x1="445" y1="413" x2="505" y2="413" stroke="${RED}" stroke-width="2"/>${text(512, 410, '등 아래 가로 띠 멍', 22, RED, 'start')}${text(512, 438, '(난간 상단 높이)', 20, RED, 'start')}
  <path d="M458 330 l12 -10 l10 12 l12 -12 l10 12" stroke="${RED}" stroke-width="4" fill="none"/>
  ${text(510, 320, '오른 소매 솔기 찢어짐', 22, RED, 'start')}
  ${figure(1020)}${text(1020, 110, '앞', 26, BLUE, 'middle', 700)}
  ${text(1020, 708, '몸 앞쪽: 밀친 흔적·방어흔 없음', 22, BLUE)}`;

const PARTS_LAUNDRY = `${frame('[세탁소] 봉투 「안 사장 6/13」')}
  ${nut(500, 330)}${text(500, 400, '녹슨 M12 너트 × 1', 28)}${text(500, 440, '점퍼 안감 솔기에 끼어 있었다', 20, '#6b5f4a')}
  <path d="M760 330 l120 -20" stroke="#e8c21a" stroke-width="10" stroke-linecap="round"/>${text(820, 400, '끊긴 노란 타이 × 1', 28)}
  ${text(640, 560, '배정숙 장부: "6/13 10:55 달빛공인 안 사장 작업 점퍼 녹물(길에서 받음)"', 22, BLUE)}`;

const PARTS_BIN = `${frame('[컨테이너] 「달빛공인중개사」 전단 봉투')}
  <rect x="120" y="150" width="150" height="70" rx="10" fill="#e8c21a"/><rect x="300" y="150" width="150" height="70" rx="10" fill="#e8c21a"/>
  ${text(285, 260, '노란 임시 클램프 × 2 (스텐실 "튼튼 0611")', 22)}
  ${[0, 1, 2, 3].map((i) => `<circle cx="${760 + i * 70}" cy="185" r="22" fill="#e8c21a" stroke="#8a6d00" stroke-width="3"/>`).join('')}
  ${text(865, 260, '볼트 캡 × 4', 22)}
  ${[0, 1, 2, 3].map((i) => `<rect x="${110 + i * 95}" y="340" width="70" height="44" rx="6" fill="${GREY}" stroke="#7d838b" stroke-width="4"/>`).join('')}
  ${text(285, 430, '연결 클램프 × 4 (W3 색 페인트)', 22)}
  ${nut(780, 362)}${nut(860, 362)}${nut(940, 362)}${text(860, 430, '녹슨 M12 너트 × 3', 22)}
  <circle cx="640" cy="560" r="50" fill="none" stroke="#e8c21a" stroke-width="22"/>${text(640, 650, '감긴 노란 테이프', 22)}`;

// Work log 2030.03.22: the basket outside the west railing.
const BASKET = `${frame('하늘사다리 작업 일지 · 2030.03.22 위치')}${arrowDefs}
  <rect x="600" y="400" width="560" height="320" fill="#b9b2a2"/>${text(880, 560, '행복하우스 (서측 벽)', 24)}
  <rect x="600" y="360" width="12" height="40" fill="#7d838b"/>${text(640, 350, '서측 난간', 20, INK, 'start')}
  <line x1="600" y1="400" x2="1160" y2="400" stroke="${INK}" stroke-width="3"/>${text(1150, 390, '옥상 바닥', 18, INK, 'end')}
  <rect x="380" y="250" width="150" height="70" fill="none" stroke="${INK}" stroke-width="5"/>${text(455, 345, '바스켓 (탑승 1인)', 20)}
  <line x1="455" y1="320" x2="300" y2="700" stroke="#e8c21a" stroke-width="16"/>
  ${dim(535, 300, 595, 300)}${text(565, 240, '난간 외측 1.2m', 22, RED, 'middle', 700)}
  ${dim(560, 320, 560, 398)}${text(552, 372, '+2.2m', 22, RED, 'end', 700)}
  ${text(640, 690, '시간 14:00~15:30 · 작업 "외관 촬영 보조" · 도식의 비율은 실제와 다르다', 18, '#6b5f4a')}`;

// The crime-scene photos (src/assets/ep2/photos) as plates, so a scene can show one behind its
// dialogue with cg('photoAlleyW3') when the record is handed over. Without the file, the diagram-free
// fallback is a plain caption card rather than a fake photo.
const caption = (s: string) => `<rect width="${W}" height="${H}" fill="#1d2338"/>${text(640, 370, s, 30, PAPER)}`;

export const EP2_DIAGRAMS: Record<string, Plate> = {
  photoAlleyW3: { title: '현장 사진 · 골목의 W3 패널', svg: caption('현장 사진 · 골목의 W3 패널'), image: 'roof-alley-w3' },
  photoParapetW3: { title: '현장 사진 · W3 자리 파라펫', svg: caption('현장 사진 · W3 자리 파라펫'), image: 'roof-parapet-w3' },
  photoFloorW3: { title: '현장 사진 · W3 앞 바닥', svg: caption('현장 사진 · W3 앞 바닥'), image: 'roof-floor-w3' },
  photoW2Tie: { title: '현장 사진 · W2 끝', svg: caption('현장 사진 · W2 끝'), image: 'roof-w2-tie' },
  photoBasket: { title: '하늘사다리 보험용 사진', svg: caption('하늘사다리 보험용 사진'), image: 'ladder-basket' },
  diagW3Back: { title: 'W3 패널 뒷면 (도식)', svg: W3_BACK },
  diagWindow: { title: '4층 창에서 본 옥상 (도식)', svg: WINDOW },
  diagSign: { title: '정숙세탁 간판틀 측량 (도식)', svg: SIGN },
  diagBody: { title: '검시 소견 흔적 위치 (도식)', svg: BODY },
  diagPartsLaundry: { title: '세탁소 봉투 부품 (도식)', svg: PARTS_LAUNDRY },
  diagPartsBin: { title: '컨테이너 봉투 부품 (도식)', svg: PARTS_BIN },
  diagBasket: { title: '바스켓 위치 (도식)', svg: BASKET },
};
