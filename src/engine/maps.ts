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
        setTimeout(() => finish(map.regions[sel].id), 350);
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
