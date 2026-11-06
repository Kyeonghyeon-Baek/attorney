import { sfx } from './audio';
import { el } from './dom';
import { push } from './input';
import { touchLayout } from './viewport';

/** A clickable area on a map, in the map's own coordinates. */
export interface MapRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapDef {
  title: string;
  /** Size of the drawing's coordinate space. */
  width: number;
  height: number;
  /** Inner SVG markup (no <svg> wrapper). */
  svg: string;
  legend: string[];
  regions: MapRegion[];
}

// 오롯24 floor plan: the store floor at the bottom, the storeroom above it, the back door on the
// storeroom's top-left wall. A passage runs along the top wall from the back door to the right-hand
// aisle. Two floor-to-ceiling shelves (the long one under the passage, the tall drinks shelf down to
// the store wall) close off a nook whose only way in is the gap at the left wall: nobody walking the
// passage or standing in CAM3's view can see the owner's desk inside it. The police marked where the
// victim lay on top of HQ's camera plan.
const OROT_SVG = `
  <defs>
    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#f4f0e6" stroke-width="2" opacity="0.5"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="1000" height="640" fill="#16204a"/>
  <g stroke="#2b3a73" stroke-width="1">
    ${Array.from({ length: 24 }, (_, i) => `<line x1="${i * 45}" y1="0" x2="${i * 45}" y2="640"/>`).join('')}
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 45}" x2="1000" y2="${i * 45}"/>`).join('')}
  </g>
  <text class="mp-out" x="70" y="34" style="text-anchor:start">← 큰길 (약 30m)</text>
  <text class="mp-out" x="560" y="34">뒷골목</text>
  <text class="mp-out" x="932" y="34" style="text-anchor:end">골목 끝 가로등 (약 50m) →</text>
  <text class="mp-out" x="500" y="628">앞길 (마포 골목)</text>

  <!-- camera views -->
  <polygon class="mp-cone" points="80,318 935,322 935,592 320,592"/>
  <polygon class="mp-cone" points="792,588 640,470 900,470"/>
  <polygon class="mp-cone" points="795,292 470,76 935,76 935,260"/>

  <!-- walls -->
  <rect x="60" y="70" width="880" height="530" fill="none" stroke="#f4f0e6" stroke-width="6"/>
  <line x1="60" y1="300" x2="750" y2="300" stroke="#f4f0e6" stroke-width="5"/>
  <line x1="840" y1="300" x2="940" y2="300" stroke="#f4f0e6" stroke-width="5"/>

  <!-- back door: a gap in the top wall with a swing -->
  <rect x="110" y="64" width="72" height="12" fill="#16204a"/>
  <path d="M110 70 A72 72 0 0 1 182 142" fill="none" stroke="#f4f0e6" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="110" y1="70" x2="110" y2="142" stroke="#f4f0e6" stroke-width="3"/>
  <text class="mp-label mp-strong" x="146" y="58">뒷문</text>

  <!-- storeroom door -->
  <rect x="750" y="294" width="90" height="12" fill="#16204a"/>
  <path d="M750 300 A60 60 0 0 1 810 360" fill="none" stroke="#f4f0e6" stroke-width="2" stroke-dasharray="5 4"/>
  <text class="mp-label" x="795" y="326">창고 문</text>

  <!-- front entrance with the shutter -->
  <rect x="420" y="592" width="160" height="16" fill="url(#hatch)" stroke="#f4f0e6" stroke-width="2"/>
  <text class="mp-label" x="500" y="584">정문 · 셔터</text>

  <!-- storeroom: the passage, the two shelves and the nook behind them -->
  <rect class="mp-shelf" x="130" y="150" width="316" height="18"/>
  <text class="mp-onshelf" x="290" y="164">가로 선반 (천장까지)</text>
  <rect class="mp-shelf" x="420" y="168" width="26" height="128"/>
  <text class="mp-small" x="456" y="250" style="text-anchor:start">키 큰 음료 선반</text>
  <text class="mp-small" x="456" y="268" style="text-anchor:start">(천장까지)</text>
  <rect class="mp-shelf" x="866" y="90" width="64" height="140"/>
  <rect class="mp-thing" x="196" y="84" width="52" height="34" rx="4"/>
  <text class="mp-small" x="258" y="106" style="text-anchor:start">폐기 봉지 자리</text>
  <text class="mp-small" x="94" y="186">틈</text>
  <path d="M94 192 L94 214" stroke="rgba(244,240,230,0.6)" stroke-width="2" stroke-dasharray="3 3"/>
  <rect class="mp-thing" x="168" y="198" width="86" height="40" rx="4"/>
  <text class="mp-small" x="211" y="223">운반대</text>
  <rect class="mp-thing" x="300" y="240" width="112" height="50" rx="3"/>
  <text class="mp-small" x="356" y="262">점주 책상</text>
  <text class="mp-small" x="356" y="280">(상패)</text>
  <g class="mp-found">
    <line x1="314" y1="200" x2="334" y2="220"/><line x1="334" y1="200" x2="314" y2="220"/>
    <text x="344" y="215">발견 위치</text>
  </g>
  <text class="mp-room" x="660" y="200">창고</text>
  <text class="mp-small" x="300" y="128" style="text-anchor:start">위쪽 통로</text>

  <!-- store floor furniture -->
  <rect class="mp-shelf" x="180" y="380" width="380" height="20"/>
  <rect class="mp-shelf" x="180" y="450" width="380" height="20"/>
  <rect class="mp-shelf" x="905" y="330" width="28" height="170"/>
  <text class="mp-small" x="842" y="420">냉장 진열대</text>
  <rect class="mp-thing" x="640" y="520" width="140" height="44" rx="4"/>
  <text class="mp-small" x="710" y="548">무인 계산대</text>
  <text class="mp-room" x="370" y="540">매장</text>

  <!-- cameras -->
  <g class="mp-cam"><circle cx="80" cy="318" r="11"/><text x="98" y="342">CAM1</text></g>
  <g class="mp-cam"><circle cx="792" cy="588" r="11"/><text x="818" y="584">CAM2</text></g>
  <g class="mp-cam"><circle cx="795" cy="292" r="11"/><text x="830" y="282">CAM3</text></g>
  <g class="mp-cam mp-gone">
    <circle cx="214" cy="54" r="11"/>
    <line x1="201" y1="41" x2="227" y2="67"/><line x1="227" y1="41" x2="201" y2="67"/>
    <text x="236" y="60">CAM4 · 3월 1일 철거</text>
  </g>
`;


// 2화 달빛마을: 남산 서남서쪽 비탈. 동쪽(오른쪽)이 오르막. 정숙세탁 4층 창에서 행복하우스 옥상으로 시선.
const VILLAGE_SVG = `
  <rect x="0" y="0" width="1000" height="640" fill="#1d2a3a"/>
  <g stroke="#2c3d52" stroke-width="1">
    ${Array.from({ length: 23 }, (_, i) => `<line x1="${i * 45}" y1="0" x2="${i * 45}" y2="640"/>`).join('')}
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 45}" x2="1000" y2="${i * 45}"/>`).join('')}
  </g>
  <path d="M40 600 L960 60" stroke="#3a5470" stroke-width="40" stroke-linecap="round" opacity="0.5"/>
  <text class="mp-out" x="930" y="40" style="text-anchor:end">오르막 · 남산 방향 (동북동 약 2.3km) ↗</text>
  <path d="M60 330 L940 330" stroke="#6b7f96" stroke-width="18"/>
  <text class="mp-small" x="80" y="320" style="text-anchor:start">달빛로</text>
  <rect class="mp-thing" x="360" y="350" width="120" height="110"/><text class="mp-label mp-strong" x="420" y="410">행복하우스</text>
  <rect class="mp-shelf" x="336" y="350" width="20" height="150"/><text class="mp-small" x="300" y="520">서쪽 계단 골목</text>
  <rect class="mp-thing" x="560" y="210" width="130" height="100"/><text class="mp-label" x="625" y="265">정숙세탁 (5층)</text>
  <path d="M575 290 L478 380" stroke="#ffd166" stroke-width="3" stroke-dasharray="8 6"/>
  <text class="mp-small" x="520" y="318">4층 창 → 옥상 (약 30m)</text>
  <rect class="mp-thing" x="720" y="110" width="110" height="80"/><text class="mp-label" x="775" y="155">변복만 댁 텃밭</text>
  <rect class="mp-thing" x="420" y="120" width="110" height="80"/><text class="mp-label" x="475" y="165">달빛 신당</text>
  <rect class="mp-thing" x="440" y="520" width="140" height="80"/><text class="mp-label" x="510" y="565">경로당 (남쪽 200m)</text>
  <rect class="mp-thing" x="90" y="380" width="130" height="80"/><text class="mp-label" x="155" y="425">달빛공인중개사</text>
  <rect class="mp-thing" x="120" y="520" width="150" height="80"/><text class="mp-label" x="195" y="565">철거 구역 · 고철 컨테이너</text>`;

// 2화 행복하우스 옥상 평면 (동서 9m × 남북 12m, 1m = 40). 서쪽 난간 W1~W4, W3만 보수 패널.
const ROOF_SVG = `
  <rect x="0" y="0" width="800" height="600" fill="#1d2a3a"/>
  <rect x="220" y="60" width="360" height="480" fill="#2c3b4e" stroke="#f4f0e6" stroke-width="4"/>
  <text class="mp-out" x="400" y="40">북</text><text class="mp-out" x="400" y="585">남</text>
  <text class="mp-out" x="120" y="300">서 · 계단 골목</text><text class="mp-out" x="690" y="300">동</text>
  <g stroke-width="10">
    <line x1="220" y1="60" x2="220" y2="160" stroke="#9aa3ad"/><line x1="220" y1="160" x2="220" y2="300" stroke="#9aa3ad"/>
    <line x1="220" y1="324" x2="220" y2="420" stroke="#d6dde4"/><line x1="220" y1="420" x2="220" y2="540" stroke="#9aa3ad"/>
  </g>
  <text class="mp-small" x="200" y="115" style="text-anchor:end">W1</text><text class="mp-small" x="200" y="235" style="text-anchor:end">W2</text>
  <text class="mp-label mp-strong" x="200" y="378" style="text-anchor:end">W3</text><text class="mp-small" x="200" y="485" style="text-anchor:end">W4</text>
  <text class="mp-small" x="200" y="396" style="text-anchor:end">(보수 패널·표지판)</text>
  <rect class="mp-shelf" x="452" y="60" width="128" height="120"/><text class="mp-onshelf" x="516" y="125">옥탑 · 물탱크</text>
  <rect x="446" y="100" width="8" height="40" fill="#ffd166"/><text class="mp-small" x="440" y="160" style="text-anchor:end">옥상 문</text>
  <circle cx="320" cy="372" r="9" fill="#f4f0e6"/><text class="mp-small" x="334" y="364" style="text-anchor:start">빨래대 기둥</text>
  <line x1="224" y1="372" x2="312" y2="372" stroke="#e08a2c" stroke-width="4" stroke-dasharray="8 5"/>
  <rect x="580" y="250" width="10" height="140" fill="#c94c3a"/><text class="mp-small" x="570" y="410" style="text-anchor:end">현수막 (검은 타이)</text>
  <rect class="mp-thing" x="300" y="470" width="200" height="50" rx="6"/><text class="mp-small" x="400" y="500">고추 채반</text>
  <g class="mp-found"><circle cx="228" cy="372" r="8"/><text x="240" y="352" style="text-anchor:start">피해자</text></g>
  <circle cx="296" cy="340" r="7" fill="#ffb4a8"/><text class="mp-small" x="304" y="330" style="text-anchor:start">소윤 (약 2m 앞)</text>`;

// 2화 행복하우스 옥상 단면 (서→동, 1m = 25, 지면 생략). 정한이 그은 선: 정숙세탁 간판틀 윗선을 스쳐 남산 전망대로.
const SECTION_SVG = `
  <defs><linearGradient id="sec-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#253a5a"/><stop offset="1" stop-color="#3e5878"/></linearGradient></defs>
  <rect x="0" y="0" width="1100" height="600" fill="url(#sec-sky)"/>
  <rect x="200" y="420" width="225" height="180" fill="#6b625a"/>
  <text class="mp-label" x="312" y="520">행복하우스 (옥상 = 지상 +12.6m)</text>
  <rect x="0" y="590" width="200" height="10" fill="#4a4440"/><text class="mp-small" x="100" y="580">계단 골목</text>
  <rect x="198" y="392" width="8" height="28" fill="#d6dde4"/><text class="mp-small" x="214" y="398" style="text-anchor:start">W3 (+1.1m)</text>
  <rect x="345" y="355" width="80" height="65" fill="#8f8a83"/><rect x="352" y="322" width="66" height="33" rx="6" fill="#3f8f8c"/>
  <text class="mp-small" x="385" y="314">물탱크 +3.9m</text>
  <rect x="1000" y="228" width="80" height="372" fill="#6b4a3e"/>
  <rect x="992" y="222" width="96" height="10" fill="#2b2626"/>
  <text class="mp-small" x="1040" y="214">간판틀 +7.7m</text>
  <text class="mp-small" x="1040" y="590">정숙세탁 (34m 앞)</text>
  <path d="M1088 210 L200 336" stroke="#ffd166" stroke-width="3" stroke-dasharray="10 6"/>
  <text class="mp-small" x="700" y="262">이 선보다 위에서만 남산 전망대가 보인다</text>
  <text class="mp-out" x="1090" y="190" style="text-anchor:end">→ 남산 (2.3km)</text>
  <g class="mp-cam"><circle cx="212" cy="380" r="6"/></g><text class="mp-small" x="240" y="374" style="text-anchor:start">서서 든 휴대폰 +1.6m</text>
  <g class="mp-cam"><circle cx="210" cy="365" r="6"/></g><text class="mp-small" x="240" y="356" style="text-anchor:start">기대고 젖혀 +2.2m</text>`;

export const MAPS: Record<string, MapDef> = {
  orot: {
    title: '오롯24 평면도 · 카메라 배치와 현장 표시',
    width: 1000,
    height: 640,
    svg: OROT_SVG,
    legend: [
      '초록 부채꼴 = 카메라가 보는 곳',
      '빨간 X = 철거된 카메라 · 주황 X = 경찰이 표시한 피해자 발견 위치',
      '선반은 모두 천장까지 닿는다',
    ],
    regions: [
      { id: 'alley', label: '뒷골목 (왼쪽 큰길 약 30m, 오른쪽 골목 끝 가로등 약 50m)', x: 64, y: 8, w: 872, h: 36 },
      { id: 'backdoor', label: '뒷문', x: 100, y: 46, w: 92, h: 42 },
      { id: 'bagSpot', label: '폐기 봉지 자리', x: 192, y: 80, w: 60, h: 42 },
      { id: 'passage', label: '위쪽 통로 (뒷문 ↔ 창고 오른쪽 통로)', x: 256, y: 90, w: 210, h: 56 },
      { id: 'nookGap', label: '가로 선반 끝 틈 (구석으로 들어가는 유일한 길)', x: 64, y: 146, w: 64, h: 44 },
      { id: 'nook', label: '구석 안쪽 (선반 두 개에 가려진 곳)', x: 64, y: 192, w: 96, h: 104 },
      { id: 'cart', label: '운반대', x: 162, y: 190, w: 100, h: 56 },
      { id: 'desk', label: '점주 책상 · 상패 · 피해자 발견 위치', x: 270, y: 196, w: 146, h: 100 },
      { id: 'aisle', label: '창고 오른쪽 통로 (CAM3가 보는 곳)', x: 470, y: 80, w: 386, h: 210 },
      { id: 'storeDoor', label: '창고 문', x: 748, y: 290, w: 94, h: 40 },
      { id: 'shelves', label: '매장 진열대', x: 176, y: 370, w: 390, h: 108 },
      { id: 'fridge', label: '냉장 진열대', x: 895, y: 326, w: 40, h: 178 },
      { id: 'counter', label: '무인 계산대', x: 636, y: 512, w: 148, h: 58 },
      { id: 'entrance', label: '정문 · 셔터', x: 412, y: 586, w: 176, h: 30 },
    ],
  },
  village: {
    title: '달빛마을 · 사건 주변',
    width: 1000,
    height: 640,
    svg: VILLAGE_SVG,
    legend: ['노란 점선 = 정숙세탁 4층 창에서 행복하우스 옥상을 보는 선', '동쪽(오른쪽)으로 갈수록 오르막'],
    regions: [
      { id: 'happy', label: '행복하우스', x: 356, y: 346, w: 128, h: 118 },
      { id: 'alley', label: '서쪽 계단 골목', x: 300, y: 346, w: 56, h: 180 },
      { id: 'laundry', label: '정숙세탁', x: 556, y: 206, w: 138, h: 108 },
      { id: 'byeon', label: '변복만 댁 텃밭', x: 716, y: 106, w: 118, h: 88 },
      { id: 'shrine', label: '달빛 신당', x: 416, y: 116, w: 118, h: 88 },
      { id: 'senior', label: '경로당', x: 436, y: 516, w: 148, h: 88 },
      { id: 'realty', label: '달빛공인중개사', x: 86, y: 376, w: 138, h: 88 },
      { id: 'scrap', label: '고철 컨테이너', x: 116, y: 516, w: 158, h: 88 },
    ],
  },
  happyRoof: {
    title: '행복하우스 옥상 평면도',
    width: 800,
    height: 600,
    svg: ROOF_SVG,
    legend: ['W3만 2019년에 끼운 보수 패널(밝은 회색). 바깥면에 건물 표지판', '주황 점선 = 6/14 밤 W3 앞 바닥에 풀려 있던 래칫 끈 (한쪽은 빨래대 기둥에)'],
    regions: [
      { id: 'w1', label: 'W1', x: 196, y: 60, w: 40, h: 100 },
      { id: 'w2', label: 'W2', x: 196, y: 160, w: 40, h: 140 },
      { id: 'w3', label: 'W3 (보수 패널)', x: 196, y: 316, w: 40, h: 108 },
      { id: 'w4', label: 'W4', x: 196, y: 424, w: 40, h: 116 },
      { id: 'pole', label: '빨래대 기둥', x: 304, y: 356, w: 34, h: 34 },
      { id: 'hut', label: '옥탑 · 물탱크', x: 448, y: 60, w: 132, h: 124 },
      { id: 'banner', label: '현수막', x: 570, y: 246, w: 30, h: 148 },
      { id: 'chili', label: '고추 채반', x: 296, y: 466, w: 208, h: 58 },
    ],
  },
  happySection: {
    title: '행복하우스 옥상 단면 · 남산이 보이는 높이',
    width: 1100,
    height: 600,
    svg: SECTION_SVG,
    legend: ['노란 점선 = 정숙세탁 간판틀 윗선과 남산 전망대를 잇는 선 (정한)', '왼쪽이 서쪽(골목), 오른쪽이 동북동'],
    regions: [
      { id: 'alley', label: '골목 바닥', x: 0, y: 560, w: 196, h: 40 },
      { id: 'stand', label: '옥상에 서서 (+1.6m)', x: 206, y: 368, w: 120, h: 24 },
      { id: 'lean', label: 'W3에 기대고 젖혀 (+2.2m)', x: 206, y: 344, w: 120, h: 24 },
      { id: 'tank', label: '물탱크 위 (+3.9m)', x: 345, y: 290, w: 80, h: 32 },
      { id: 'basket', label: '난간 바깥 허공, 선보다 위', x: 110, y: 260, w: 86, h: 70 },
      { id: 'below', label: '난간 바깥, 선보다 아래', x: 110, y: 340, w: 86, h: 80 },
      { id: 'laundryTop', label: '정숙세탁 간판틀 위', x: 990, y: 180, w: 100, h: 44 },
    ],
  },
};

/**
 * Full-screen map. In 'view' mode it is just a closer look. In 'pick' mode the player chooses a
 * spot, then confirms it (a second click, Enter, or the button), and the promise resolves with
 * that region's id.
 */
export class MapView {
  private root: HTMLElement | null = null;

  get isOpen(): boolean {
    return !!this.root;
  }

  open(
    stage: HTMLElement,
    mapId: string,
    mode: 'view' | 'pick',
    prompt = '',
    openRecord?: () => Promise<unknown>,
    onHint?: () => void,
  ): Promise<string | null> {
    const map = MAPS[mapId];
    const root = el('div', `mapview mapview-${mode}`, stage);
    this.root = root;
    const panel = el('div', 'mapview-panel', root);
    const head = el('header', 'mapview-head', panel);
    el('h2', 'mapview-title', head, map.title);
    if (prompt) el('p', 'mapview-prompt', head, prompt);
    const plan = el('div', 'mapview-plan', panel);
    plan.style.aspectRatio = `${map.width} / ${map.height}`;
    plan.innerHTML = `<svg viewBox="0 0 ${map.width} ${map.height}" aria-hidden="true">${map.svg}</svg>`;
    const tip = el('div', 'mapview-tip', plan);
    const spots = map.regions.map((r) => {
      const b = el('button', 'map-spot', plan);
      b.style.left = `${(r.x / map.width) * 100}%`;
      b.style.top = `${(r.y / map.height) * 100}%`;
      b.style.width = `${(r.w / map.width) * 100}%`;
      b.style.height = `${(r.h / map.height) * 100}%`;
      b.setAttribute('aria-label', r.label);
      const show = () => {
        tip.textContent = r.label;
        tip.style.left = `${((r.x + r.w / 2) / map.width) * 100}%`;
        tip.style.top = `${((r.y + r.h / 2) / map.height) * 100}%`;
        tip.classList.add('on');
      };
      b.addEventListener('mouseenter', show);
      b.addEventListener('focus', show);
      b.addEventListener('mouseleave', () => tip.classList.remove('on'));
      return b;
    });
    const foot = el('footer', 'mapview-foot', panel);
    const legend = el('div', 'mapview-legend', foot);
    for (const line of map.legend) el('span', '', legend, line);
    const btns = el('div', 'mapview-btns', foot);
    if (onHint) el('button', 'btn', btns, '힌트  H').addEventListener('click', onHint);
    const recBtn = openRecord ? el('button', 'btn', btns, '법원기록  R') : null;
    const close = mode === 'view' ? el('button', 'btn btn-primary', btns, '닫기  Esc') : null;
    let readout: HTMLElement | null = null;
    let confirm: HTMLButtonElement | null = null;
    if (mode === 'pick') {
      // Picking is two steps, so the bar says what is chosen and what confirms it.
      const bar = el('div', 'mapview-pickbar', panel);
      readout = el('div', 'mapview-readout', bar, touchLayout() ? '자리를 눌러 고르세요' : '클릭하거나 ← → 로 자리를 고르세요');
      el('span', 'mapview-hint', bar, '한 번 더 클릭하거나 Enter로 지목');
      confirm = el('button', 'btn btn-primary', bar, '이 자리를 지목한다  Enter');
      confirm.disabled = true;
    }
    sfx('paper');

    let sel = -1;
    const select = (i: number) => {
      sel = (i + spots.length) % spots.length;
      spots.forEach((b, k) => b.classList.toggle('sel', k === sel));
      spots[sel].focus();
      if (readout) {
        readout.replaceChildren();
        el('span', 'mapview-readout-label', readout, '고른 자리');
        el('strong', '', readout, map.regions[sel].label);
      }
      if (confirm) confirm.disabled = false;
      sfx('select');
    };

    return new Promise((resolve) => {
      let busy = false;
      const finish = (id: string | null) => {
        pop();
        root.remove();
        this.root = null;
        resolve(id);
      };
      const pick = () => {
        if (busy || sel < 0) return;
        busy = true;
        sfx('evidence');
        spots[sel].classList.add('picked');
        // The answer is fixed now: a stray click during the beat must not change it.
        const chosen = map.regions[sel].id;
        setTimeout(() => finish(chosen), 350);
      };
      const pop = push((a) => {
        if (busy) return;
        if (a === 'back' && mode === 'view') {
          sfx('close');
          finish(null);
        } else if (a === 'right' || a === 'down') select(sel + 1);
        else if (a === 'left' || a === 'up') select(sel < 0 ? -1 : sel - 1);
        else if (a === 'advance') {
          if (mode === 'pick') pick();
          else finish(null);
        } else if (a === 'record' && openRecord) void viewRecord();
      }, { strict: true });
      const viewRecord = async () => {
        busy = true;
        root.hidden = true;
        await openRecord!();
        root.hidden = false;
        busy = false;
      };
      spots.forEach((b, i) =>
        b.addEventListener('click', () => {
          if (mode === 'pick' && sel === i) pick();
          else select(i);
        }),
      );
      confirm?.addEventListener('click', pick);
      recBtn?.addEventListener('click', () => void viewRecord());
      close?.addEventListener('click', () => {
        sfx('close');
        finish(null);
      });
    });
  }
}
