import type { Location, Script } from '../../engine/types';
import { flag, memo, say, when } from '../script';

type Lead = { to: string[]; needs: string[]; script: Script };

/** Persist each lead before its dialogue; revisiting or resuming never repeats it. */
function applyFlow(locations: Record<string, Location>, leads: Lead[], known: Record<string, string> = {}): void {
  const progress: Script = [];
  for (const lead of leads) {
    const key = `route:${lead.to[0]}`;
    for (const id of lead.to) locations[id].requires = key;
    let unlock: Script = [
      flag(key),
      when(`visited:${lead.to[0]}`, [], lead.script),
    ];
    for (const need of [...lead.needs].reverse()) unlock = [when(need, unlock)];
    progress.push(when(key, [], unlock));
  }
  for (const location of Object.values(locations)) {
    location.progress = progress;
    location.maskUnvisited = true;
    location.knownFrom = known[location.id];
  }
}

export function guideDayOne(locations: Record<string, Location>): void {
  applyFlow(locations, [
    { to: ['d1alley'], needs: ['d1:soyoonRoof', 'd1:boilerCode'], script: [
      say('narae', '안 밀었다는데, 봤다는 사람은 있고… 누구 말이 맞는 거야?', 'sad'),
      say('dan', '말만 듣고는 모르지. 떨어진 자리부터 보자.'),
      say('narae', '행복하우스 뒤쪽 계단이지? 내가 안내할게!'),
      memo('[다음 조사] 서쪽 계단 골목에서 구만두 형사와 현장을 확인하자.'),
    ] },
    { to: ['d1entrance'], needs: ['route:d1alley', 'postmortem', 'phoneScreen', 'firstStatement', 'dalbitMap'], script: [
      say('dan', '떨어진 자리와 기록은 확인했어. 이제 건물 안으로 들어가 보자.'),
      say('narae', '현관에서 은결 씨도 찾아보자. 소윤 씨가 자료를 맡겼다며.'),
      memo('[다음 조사] 행복하우스 현관에서 은결에게 소윤의 소개를 전하자.'),
    ] },
    { to: ['d1roof'], needs: ['route:d1entrance', 'appraisal'], script: [
      say('dan', '리포트는 챙겼으니, 이제 소윤 씨가 서 있던 옥상을 보자.'),
      say('narae', '남산이 보인다는데… 올라가면 알겠지?'),
      memo('[다음 조사] 행복하우스 옥상의 흔적과 목격자의 위치를 확인하자.'),
    ] },
    { to: ['d1laundry'], needs: ['route:d1roof', 'd1:roofTab', 'd1:reenactReady'], script: [
      say('dan', '준비됐어. 세탁소에서 사장님 말씀을 듣고 창가에서 확인할게.'),
      memo('[다음 조사] 정숙세탁에서 목격담을 듣고 4층 창의 시야를 재현하자.'),
    ] },
    { to: ['d1shrine', 'd1realty'], needs: ['route:d1laundry', 'd1:windowShot', 'talked:d1laundry:saw'], script: [
      say('dan', '저 창에서는 두 사람의 손을 구분하기 어려워. 목격담만으로 밀었다고 단정할 순 없어.'),
      say('narae', '리포트엔 옥상에서 남산이 훤히 보인댔지? 우리 할머니는 거기서 삼십 년 고추를 널었으니까 여쭤보자.'),
      say('dan', '할머니 말씀도 듣고, 건물 관리를 맡은 달빛공인 안 소장님도 만나 보자. 어느 쪽부터 가도 괜찮아.'),
      memo('[다음 조사] 달빛 신당에서 옥상 이야기를 듣고, 달빛공인에서 건물 관리와 출입 기록을 확인하자.'),
    ] },
    { to: ['d1senior'], needs: ['route:d1shrine', 'd1:okbunTalk', 'd1:ahnMet', 'roofDoorLog'], script: [
      say('narae', '참, 사건 난 저녁에 경로당에서 재개발 설명회가 있었어. 동네 어르신들 다 모이셨을걸?'),
      say('dan', '그날 저녁 동네 분위기나 옥상 수리 이야기를 들을 수 있을지 경로당에도 들러 보자.'),
      memo('[다음 조사] 경로당에서 사건 당일 저녁 설명회와 동네 이야기를 확인하자.'),
    ] },
  ]);
}

export function guideDayTwo(locations: Record<string, Location>): void {
  applyFlow(locations, [
    { to: ['d2scrap'], needs: ['d2:strapSeen', 'd2:scrapHint'], script: [
      say('dan', '끈은 봉인했으니, 이번엔 컨테이너야. 고철 차가 오기 전에 찾아야 해.'),
      memo('[다음 조사] 철거 구역 고철 컨테이너에서 버려진 부품을 확보하자.'),
    ] },
    { to: ['d2mgmt', 'd2laundry'], needs: ['route:d2scrap', 'd2:binBag'], script: [
      say('dan', '급한 증거는 확보했어. 이제 어제 법정에서 나온 관리사무실을 살펴보고, 정숙세탁에서도 더 물어보자.'),
      say('narae', '사무실은 총무인 은결 씨한테 입회해 달라고 하자. 정숙 이모한테도 더 물어볼 게 있고!'),
      memo('[다음 조사] 관리사무실 내부를 살펴보고 정숙세탁에서 추가 단서를 확인하자.'),
    ] },
    { to: ['d2visit'], needs: ['route:d2mgmt', 'd2:camFound'], script: [
      say('dan', '금고와 책상이 한눈에 찍히는 카메라였어. 할머니 쌀독에 맡긴 원본 서류, 소윤 씨에게 동의를 받아 오자.'),
      memo('[다음 조사] 구치소에서 원본 서류를 받을 동의를 구하자.'),
    ] },
    { to: ['d2shrine'], needs: ['route:d2visit', 'd2:soyoonConsent'], script: [
      say('narae', '할머니한테 전하러 가자. 맡긴 사람이 괜찮다고 했으니까.'),
      memo('[다음 조사] 신당에 소윤의 동의를 전하고 원본을 회수하자.'),
    ] },
    { to: ['d2ladder'], needs: ['route:d2shrine', 'originals', 'd2:highShot'], script: [
      say('dan', '청구서의 고소작업 차량, 그리고 높은 곳에서 찍은 사진… 기사님께 확인하자.'),
      say('narae', '하늘 언니 차고로 가면 돼. 내가 길 알아!'),
      memo('[다음 조사] 하늘사다리 차고에서 촬영 작업의 배차 일지를 확인하자.'),
    ] },
    { to: ['d2byeon'], needs: ['route:d2shrine', 'd2:laundryBag', 'talked:d2shrine:why'], script: [
      say('dan', '버려진 부품과 점퍼 속 너트는 챙겼어. 이번엔 수리하는 모습을 원본으로 보자.'),
      say('narae', '위원장님 댁 옥상으로 가자. 나도 제대로 부탁드릴게.'),
      memo('[다음 조사] 변복만 댁에서 수리 영상 원본을 받고 그날 저녁 설명회 상황도 확인하자.'),
    ] },
  ], { d2roof: 'd1roof', d2laundry: 'd1laundry', d2visit: 'd1visit', d2shrine: 'd1shrine' });
}
