import type { Location, Script } from '../../engine/types';
import { flag, memo, say, think, when } from '../script';

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
      say('narae', '휴… 접견실 공기 왜 이렇게 무거워? 나 저 사람 진짜 숨 막혀, 언니.', 'angry'),
      say('narae', '안 밀었다는데, 봤다는 사람은 있고… 누구 말이 맞는 거야?', 'sad'),
      think('(나래 말대로다. 사건 나흘 전엔 "죽여 버리고 싶다"고 썼고, 그 순간 옥상엔 단둘뿐이었어.)'),
      think('(그런데도 "잡으려고 손 뻗었어요" 하던 그 떨리는 목소리가 자꾸 마음에 걸린다.)'),
      think('(…정신 차리자, 강단비. 의뢰인을 믿는 거랑 사실로 입증하는 건 다른 문제야.)'),
      say('dan', '지금은 누구 말을 믿을지 따질 때가 아니야. 우리가 아는 사실부터 정리해 보자.', 'normal'),
      say('narae', '응. 그러니까… 사건이 난 게 그저께인 6월 14일 토요일 저녁이지?', 'normal'),
      say('dan', '맞아. 저녁 일곱 시 사십사 분에 소윤 씨가 옥상 문을 열었고, 사십육 분에 최봉구 씨가 추락했어.', 'point'),
      say('dan', '내일 아침 열 시가 벌써 첫 공판인데, 판관의 유죄 예측치는 89.4%야.', 'normal'),
      say('narae', '89.4%… 숫자만 봐도 숨이 턱 막힌다.', 'sad'),
      say('dan', '말만 듣고는 모르지. 떨어진 자리부터 보자.', 'normal'),
      say('narae', '행복하우스 뒤쪽 계단이지? 내가 안내할게!', 'normal'),
      memo('[다음 조사] 서쪽 계단 골목에서 구만두 형사와 현장을 확인하자.'),
    ] },
    { to: ['d1entrance'], needs: ['route:d1alley', 'postmortem', 'phoneScreen', 'firstStatement', 'dalbitMap'], script: [
      say('narae', '언니, 수첩에 적을 게 산더미야. 그래서 지금 확실한 게 뭐야?', 'normal'),
      say('dan', '첫째, 검시 소견. 등 아래쪽에 가로로 긴 멍이 남았고 몸 앞쪽은 깨끗해.', 'point'),
      say('dan', '정면에서 멱살을 잡거나 세게 밀친 흔적은 안 나왔다는 뜻이야.', 'normal'),
      say('narae', '그리고 세탁소 이모가 그날 밤 경찰한테 한 첫 진술도 봤잖아!', 'surprised'),
      say('dan', '응. 두 손 든 남자, 휘청이는 난간, 뛰어나와 팔 뻗은 여자. 그다음에 "떨어져".', 'point'),
      say('dan', '소윤 씨가 말한 순서랑 맞물리는 구석이 있어.', 'normal'),
      say('narae', '그럼 진짜 안 민 거 아냐?', 'surprised'),
      say('dan', '아직 단정하진 마. 최봉구 씨가 왜 휴대폰을 머리 위로 들고 뒷걸음질 쳤는지는 모르잖아.', 'normal'),
      say('dan', '떨어진 자리와 기록은 확인했어. 이제 건물 안으로 들어가 보자.', 'normal'),
      say('narae', '현관에서 은결 씨도 찾아보자. 소윤 씨가 자료를 맡겼다며.', 'normal'),
      memo('[다음 조사] 행복하우스 현관에서 은결에게 소윤의 소개를 전하자.'),
    ] },
    { to: ['d1roof'], needs: ['route:d1entrance', 'appraisal'], script: [
      think('(자기 사건보다 일곱 집 서류부터 챙겨 달라던 사람이었지.)'),
      think('(접견실에서 팔짱을 단단히 끼고 있던 소윤 씨의 어깨가 조금 다르게 떠오른다.)'),
      say('narae', '…언니, 나 속이 좀 복잡해.', 'sad'),
      say('dan', '왜, 소윤 씨가 부탁한 일이 마음에 걸려?', 'normal'),
      say('narae', '우리 할머니 이사 밀린 건 아직도 밉거든? 상자 위에서 밥 드시는 거 보면 속상하고.', 'sad'),
      say('narae', '근데 일곱 집이 한꺼번에 경매에 넘어간다니까… 남 일 같지가 않아.', 'sad'),
      say('dan', '미운 것도 당연하고 안쓰러운 것도 당연해. 둘 다 억지로 지우지 않아도 돼.', 'normal'),
      say('dan', '우리가 할 일은 이 리포트에 적힌 "남산 조망 1억 6천"이 진짜인지 직접 확인하는 거야.', 'point'),
      say('dan', '리포트는 챙겼으니, 이제 소윤 씨가 서 있던 옥상을 보자.', 'normal'),
      say('narae', '남산이 보인다는데… 올라가면 알겠지?', 'normal'),
      memo('[다음 조사] 행복하우스 옥상의 흔적과 목격자의 위치를 확인하자.'),
    ] },
    { to: ['d1laundry'], needs: ['route:d1roof', 'd1:roofTab', 'd1:reenactReady'], script: [
      think('(…아까 문 열자마자 반 발짝 물러섰을 때, 등 뒤로 서늘한 허공이 느껴졌다.)'),
      think('(토요일 저녁 일곱 시 사십육 분. 기대 있던 난간이 통째로 넘어갈 때 최봉구 씨는 무슨 생각을 했을까.)'),
      think('(그리고 바로 코앞에서 그걸 본 소윤 씨는… 얼마나 덜덜 떨렸을까.)'),
      say('narae', '언니, 얼굴이 좀 창백해. 아까 난간 쪽 보고 놀란 거 아직 안 가셨어?', 'sad'),
      say('dan', '어? 아, 괜찮아. 그냥… 사람이 떨어진 자리라는 게 이제야 실감이 나서.', 'sweat'),
      say('narae', '…응. 나도 서쪽 끝은 두 번 못 보겠더라.', 'sad'),
      say('dan', '그래도 옥상에서 해야 할 실측은 마쳤어. 너트 없는 볼트 네 개랑 풀린 끈 위치도 적었고.', 'normal'),
      say('narae', '이제 나랑 구 형사님이 여기서 줄 맞춰 서 있으면 되는 거지?', 'normal'),
      say('dan', '응, 준비됐어. 세탁소 사장님 말씀도 들어 보고 창가에서 직접 확인해 볼게.', 'normal'),
      memo('[다음 조사] 정숙세탁에서 목격담을 듣고 4층 창의 시야를 재현하자.'),
    ] },
    { to: ['d1shrine', 'd1realty'], needs: ['route:d1laundry', 'd1:windowShot', 'talked:d1laundry:saw'], script: [
      say('narae', '언니, 창가에서 보니까 어때? 내가 구 형사님 등 뒤에 가려서 안 보였지?', 'normal'),
      say('dan', '응. 4층 창이랑 앞사람, 난간이 거의 한 줄로 겹쳐. 해 질 녘 역광까지 더하면 실루엣뿐이야.', 'point'),
      say('dan', '저 창에서는 두 사람의 손을 구분하기 어려워. 목격담만으로 밀었다고 단정할 순 없어.', 'normal'),
      say('narae', '그럼 법정에서 세탁소 이모 말은 흔들 수 있겠네!', 'happy'),
      think('(…잠깐. 반가운 마음이 앞서는 걸 보니 또 내 나쁜 버릇이 나오려 한다.)'),
      say('dan', '나래야, 목격담이 흔들린다고 바로 무죄가 되는 건 아니야.', 'normal'),
      say('dan', '옥상에 둘만 있었던 건 사실이고, 왜 뒷걸음질 치다 떨어졌는지는 아직 모르니까.', 'point'),
      say('narae', '맞아… 리포트엔 옥상에서 남산이 훤히 보인댔지? 우리 할머니는 거기서 삼십 년 고추를 널었으니까 여쭤보자.', 'normal'),
      say('dan', '할머니 말씀도 들어 보고, 건물 관리하는 달빛공인 안 소장님도 만나 보자. 어디부터 가든 괜찮아.', 'normal'),
      memo('[다음 조사] 달빛 신당에서 옥상 이야기를 듣고, 달빛공인에서 건물 관리와 출입 기록을 확인하자.'),
    ] },
    { to: ['d1senior'], needs: ['route:d1shrine', 'd1:okbunTalk', 'd1:ahnMet', 'roofDoorLog'], script: [
      say('narae', '아우, 다리야… 언니, 우리 오늘 달빛마을 계단만 몇백 개는 오르내린 것 같아.', 'sad'),
      say('dan', '구두 굽이 오늘 반은 닳았을 거야. 그래도 조각이 조금씩 모이고 있어.', 'sweat'),
      say('narae', '참, 사건 난 저녁에 경로당에서 재개발 설명회가 있었어. 동네 어르신들 다 모이셨을걸?', 'normal'),
      say('dan', '토요일 저녁이면 사건이 난 시간이랑 겹치네.', 'point'),
      say('dan', '그날 저녁 동네 분위기나 옥상 수리 이야기를 들을 수 있을지 경로당에도 들러 보자.', 'normal'),
      say('narae', '가자! 경로당 가면 어르신들이 떡이라도 한 조각 주실지 몰라!', 'happy'),
      memo('[다음 조사] 경로당에서 사건 당일 저녁 설명회와 동네 이야기를 확인하자.'),
    ] },
  ]);
}

export function guideDayTwo(locations: Record<string, Location>): void {
  applyFlow(locations, [
    { to: ['d2scrap'], needs: ['d2:strapSeen', 'd2:scrapHint'], script: [
      say('narae', '언니, 방금 본 거… 내가 잘못 본 거 아니지? 그래서 지금 확실한 게 뭐야?', 'surprised'),
      say('dan', '첫째, W3 자리엔 너트 없는 앵커 볼트 네 개가 남아 있어.', 'point'),
      say('dan', '둘째, 래칫 끈. 파란 방수포 구멍엔 흔적이 없고, 갈고리 안쪽엔 중앙 난간과 같은 회색 페인트가 묻어 있었어.', 'point'),
      say('dan', '그 끈은 방수포가 아니라 난간을 안쪽으로 당겨 묶고 있었던 거야.', 'normal'),
      say('narae', '그럼 어젯밤에 갑자기 인부들을 불러서 밑동을 잘라 내라고 한 것도…', 'sad'),
      say('narae', '…태수 아저씨가 왜? 주민들 위험할까 봐 그랬다고 하기엔 너무 이상하잖아.', 'sad'),
      think('(나래 목소리가 작아졌다. 어젯밤부터 애써 누르던 의심이 턱 끝까지 차오른 얼굴이야.)'),
      say('dan', '지금은 멈춰 서서 놀랄 시간이 없어. 오늘 오후 세 시면 고철 수거차가 온댔어.', 'normal'),
      say('dan', '반장님이 말한 철거 구역 컨테이너부터 뒤지자. 지난주에 버렸다는 봉투도 거기 있을지 몰라.', 'point'),
      memo('[다음 조사] 철거 구역 고철 컨테이너에서 버려진 부품을 확보하자.'),
    ] },
    { to: ['d2mgmt', 'd2laundry'], needs: ['route:d2scrap', 'd2:binBag'], script: [
      say('narae', '언니… "튼튼 0611" 임시 클램프에 노란 테이프, 연결 클램프 네 개에 녹슨 너트 셋까지.', 'sad'),
      say('narae', '다 옥상에서 사라진 것들이잖아. 근데 왜 그게 달빛공인 전단 봉투에서 나와?', 'sad'),
      say('narae', '설마… 진짜 태수 아저씨가 그런 거야? 우리 할머니 수도도 고쳐 주고, 웃으면서 커피도 타 주던 사람이?', 'sad'),
      think('(나래의 "설마"가 내 마음속에서도 똑같이 울린다. 하지만 여기서 고개를 끄덕이면 안 돼.)'),
      say('dan', '나래야. 수상한 것과 그 사람이 했다고 단정하는 건 다른 일이야.', 'normal'),
      say('dan', '아까 네 말대로 그 전단 봉투는 동네 할머니들도 들고 다녀. 짐작으로 빈칸을 채우면 어제 판관이랑 다를 게 없어.', 'point'),
      say('narae', '…응. 미안, 언니. 내가 너무 앞서갔지.', 'sad'),
      say('dan', '미안할 게 뭐 있어. 그만큼 믿었던 어른이니까 흔들리는 게 당연해.', 'normal'),
      say('dan', '급한 고철 증거는 확보했으니, 이제 어제 법정에서 나온 관리사무실을 살펴보고 정숙세탁에서도 더 물어보자.', 'normal'),
      say('narae', '사무실은 총무인 은결 씨한테 입회해 달라고 하자. 정숙 이모한테도 더 물어볼 게 있고!', 'normal'),
      memo('[다음 조사] 관리사무실 내부를 살펴보고 정숙세탁에서 추가 단서를 확인하자.'),
    ] },
    { to: ['d2visit'], needs: ['route:d2mgmt', 'd2:camFound'], script: [
      say('narae', '스피커인 줄 알았더니 홈캠이었다니… 금고랑 책상이 한눈에 다 찍히는 자리였네.', 'surprised'),
      say('dan', '응. 검찰이 법정에 낸 건 소윤 씨가 봉투를 들고 나가는 짧은 발췌본뿐이었어.', 'point'),
      say('dan', '그리고 그 봉투에 있던 원본 서류는 지금 신당 쌀독에 들어 있고.', 'normal'),
      say('narae', '그럼 할머니한테 가서 바로 달라고 하자! 우리 할머니가 지켜 주신 거잖아.', 'normal'),
      say('dan', '아무리 급해도 맡긴 사람 동의 없이 가져올 순 없어. 어르신이 지켜 주신 신의를 우리가 깨면 안 되잖아.', 'normal'),
      think('(게다가 소윤 씨가 왜 불리해질 줄 알면서도 그 밤에 서류를 빼돌렸는지, 본인 입으로 들어야 해.)'),
      think('(숨겼던 일을 털어놓게 하는 건 변호사한테도, 의뢰인한테도 참 괴로운 일이지만… 피할 수 없어.)'),
      say('dan', '구치소부터 가자. 소윤 씨한테 솔직하게 말하고 원본 서류를 가져와도 될지 허락을 받자.', 'point'),
      memo('[다음 조사] 구치소에서 원본 서류를 받을 동의를 구하자.'),
    ] },
    { to: ['d2shrine'], needs: ['route:d2visit', 'd2:soyoonConsent'], script: [
      think('(접견실을 나오는데 목이 메었다. "그거 지키느라 할머니가 욕먹는 거, 더는 싫어요".)'),
      say('narae', '…언니. 나 방금 접견실에서 조금 울 뻔했어.', 'sad'),
      say('narae', '맨날 뾰족하게 굴길래 자기 보증금만 아까운 사람인 줄 알았거든.', 'sad'),
      say('narae', '근데 그 밤에 서류 들고 나온 것도, 할머니한테 맡기고 입 다문 것도… 다 동네 계약들 안 묻히게 하려던 거였잖아.', 'sad'),
      say('dan', '방법이 거칠고 위험했던 건 사실이야. 법정에서 그 점까지 예쁘게 포장해 줄 순 없어.', 'normal'),
      say('dan', '그래도 그 서류가 안 사라지게 지켜 둔 덕분에, 우리가 내일 싸울 무기가 남았어.', 'point'),
      say('narae', '응… 할머니한테 빨리 말씀드리러 가자. 맡긴 사람이 괜찮다고, 밥도 먹었다고 했으니까.', 'normal'),
      say('dan', '그래. 신당에 가서 어르신께 말씀드리고 원본 서류를 받아 오자.', 'normal'),
      memo('[다음 조사] 신당에 소윤의 동의를 전하고 원본을 회수하자.'),
    ] },
    { to: ['d2ladder'], needs: ['route:d2shrine', 'originals', 'd2:highShot'], script: [
      say('narae', '으아, 팔 빠지는 줄 알았네! 마당에서 아무리 팔을 뻗어도 41프로밖에 안 나오다니!', 'angry'),
      say('dan', '어르신 말씀이 결정적이었어. "처마 위에서 내려다본 그림을 땅에서 들이대니 맞을 턱이 있냐".', 'point'),
      say('dan', '그리고 쌀독에서 나온 청구서 맨 윗줄, "외관 촬영 고소작업 차량 25만 포함".', 'point'),
      say('narae', '땅에 서서는 죽었다 깨어나도 안 나오는 구도를, 사다리차를 타고 올라가서 찍었다는 거지?', 'surprised'),
      say('dan', '응. 누가, 언제, 어떤 자세로 그 높은 곳에서 사진을 찍었는지 확인해야 해.', 'normal'),
      think('(오전부터 계단에 골목까지 뛰어다녀서 종아리는 뻐근하지만, 퍼즐이 맞춰지니 발걸음이 저절로 빨라진다.)'),
      say('dan', '청구서의 고소작업 차량, 그리고 높은 곳에서 찍은 사진… 기사님께 확인하러 가자.', 'normal'),
      say('narae', '하늘 언니 차고로 가면 돼. 내가 길 알아!', 'normal'),
      memo('[다음 조사] 하늘사다리 차고에서 촬영 작업의 배차 일지를 확인하자.'),
    ] },
    { to: ['d2byeon'], needs: ['route:d2shrine', 'd2:laundryBag', 'talked:d2shrine:why'], script: [
      say('narae', '언니… 고철 컨테이너에서 나온 너트 세 개랑, 정숙 이모네 점퍼 솔기에서 나온 너트 한 개.', 'sad'),
      say('dan', '합치면 네 개야. 옥상 W3 밑동에 남은 볼트 네 개와 숫자가 딱 맞아.', 'point'),
      say('dan', '거기에 끊긴 노란 타이와 임시 클램프까지, 11일에 묶어 둔 안전장치가 어디로 갔는지도 다 나왔어.', 'normal'),
      say('narae', '머릿속으로는 다 이어지는데… 난 아직도 아저씨 손이 그걸 풀었다는 게 안 믿겨.', 'sad'),
      say('dan', '안 믿기는 게 당연해. 그러니까 추측 말고 눈으로 직접 확인하자.', 'normal'),
      say('dan', '단톡방에 올라왔던 깍두기 화질 말고, 13일 아침에 찍힌 수리 영상 원본을 봐야겠어.', 'point'),
      say('narae', '위원장님 댁 옥상으로 가자. 나도 옆에서 잘 말씀드려 볼게.', 'normal'),
      memo('[다음 조사] 변복만 댁에서 수리 영상 원본을 받고 그날 저녁 설명회 상황도 확인하자.'),
    ] },
  ], { d2roof: 'd1roof', d2laundry: 'd1laundry', d2visit: 'd1visit', d2shrine: 'd1shrine' });
}
