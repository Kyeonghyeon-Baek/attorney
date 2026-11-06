# 2화 법원기록 요약·대사 통합본 최종 검수 (`evidence-final-review.md`)

- **검수 일자:** 2026-11-06 (디스크 실제 파일 기준 정정 완료)
- **검수 대상:** `src/content/ep2/evidence-pages.ts`, `src/content/ep2/records.ts`, `src/content/ep2/case.ts`, `src/content/ep2/investigation1.ts`, `src/content/ep2/investigation2.ts`, `src/content/ep2/trial1.ts`, `src/content/ep2/trial2.ts`, `src/content/ep2/finale.ts`

> **통합 후 상태 (GPT):** 아래 유효 지적 두 건은 Claude가 반영했고, 획득 순서·체크포인트·핫스팟 생략 경로 회귀 테스트까지 통과했다. 본문은 검수 시점의 지적을 기록한 것이다. 최종 결과는 `evidence-redesign-review.md` 참고.

---

## 1. GPT 요청 4대 수정 사항 및 주요 요약 상태 확인

| 항목 | 현재 디스크 코드 위치 및 문안 | 상태 |
| --- | --- | --- |
| **`homecam`** (`추락 4분 뒤` → `19:51`) | `evidence-pages.ts:208` `'관리사무실 스피커 카메라의 경찰 발췌본. 19:51 피고인이 책상 위 서류 봉투를 들고 나간다.'` (53자)<br>`investigation2.ts:615` `'사무실 홈캠 원본. 19:51 피고인 반출 뒤, 20:14~20:31 안태수가 출력 후에도 방을 뒤진다.'` (58자) | **정상 반영** |
| **`postmortem`** (`멍만` 단정 제거) | `evidence-pages.ts:51` `'추락사. 등 아래에 난간 높이의 가로 멍, 몸 앞쪽엔 밀친 흔적이 없다. 오른 소매가 찢어졌다.'` (53자)<br>`trial1.ts:754` `'앞쪽엔 밀친 흔적이 없다. 오른 소매는 안쪽으로 당겨 찢겼고, 손톱 밑 섬유는 피고인 옷과 같은 종류.'` (57자) | **정상 반영** |
| **`railReport`** (추락 당시 끈 부착 오해 제거) | `evidence-pages.ts:379` `'구조 감정. 고정이 풀린 W3가 기록된 자세의 하중으로 바깥으로 넘어갔다. 끈 고리엔 W3 페인트.'` (55자) | **정상 반영** |
| **`looseParts`** (획득 순서 분기) | `evidence-pages.ts:250` `'옥상 서쪽 난간에서 풀려 나온 부품. 찾은 곳마다 칸이 채워진다.'` (36자)<br>`investigation2.ts:182, 255` `when('d2:binBag')` / `when('d2:laundryBag')` 분기 | **분기 반영 (단, `case.ts` 순회 충돌 수정 중 — 아래 문제 1)** |
| **`appraisal` / `moveInPhoto` / `serverReply` 초기 요약** *(정정)* | `evidence-pages.ts:133` `'행복하우스 감정서(20억 3천). 남산 조망 사진(+1억 6천)과 201·302호 실내 사진이 실려 있다.'` (59자)<br>`evidence-pages.ts:222` `'피고인이 입주 날(2030.5.2) 찍은 302호. 감정서 302호 사진과 같은 구도, 소화기·인터폰.'` (57자)<br>`evidence-pages.ts:397` `'추락 직전 12초간의 현장 인증 클립(영상·기기 마이크 음성·프레임 5장)과 운영사 서버 기록.'` (53자)<br>`records.ts:256-262` `serverReply.tabs`에 `t2:frame33` 잠금 없음 | **정상 (스포일러·정답 선공개 없음)** |

> **정정 메모:** 이전 검수본의 문제 2(`serverReply`)·문제 3(`appraisal`, `moveInPhoto`)은 이전 세션 요약의 오기에서 비롯된 잘못된 인용이었습니다. 실제 디스크의 `evidence-pages.ts`와 `records.ts`를 재확인한 결과 세 항목 모두 스포일러 없이 53~59자로 정상 작성되어 있어 수정 대상에서 제외했습니다.

---

## 2. 실제 코드 기준 수정 필요 사항 (총 2건 — 현재 반영 중)

### [P1 / 치명] 문제 1. `looseParts` 조건부 `revise()`가 `case.ts`의 `edits()`와 충돌해 2일차 공판 체크포인트에서 컨테이너 단독 요약으로 덮어씌워짐

- **위치:**
  - `src/content/ep2/investigation2.ts:182` (`d2laundry` → `drawer`)
  - `src/content/ep2/investigation2.ts:255` (`d2scrap` → `dig` → `bag`)
  - (연관) `src/content/ep2/case.ts:22-34, 42` (`edits()`, `ED2`)
- **이유:**
  - `case.ts`의 `edits()`는 AST 객체를 재귀 순회(`Object.values(v).forEach(walk)`)하면서 `when()`의 `then`과 `else` 분기 안에 있는 모든 `revise()`를 순서대로 `ED2`에 넣습니다.
  - `d2scrap`(`investigation2.ts:255`)의 `else` 분기에 컨테이너 단독 `revise()`가 있으면 `ED2` 배열의 마지막 `rev:looseParts` 항목이 합산 요약이 아닌 컨테이너 단독 요약이 되어, 2일차 공판 이후 체크포인트(`trial2`, `ahnStand2`, `ahnStand3`, `motive`, `epilogue`)에서 세탁소 너트·타이 요약이 덮어씌워집니다.

- **교정 (`src/content/ep2/investigation2.ts:182, 255`):**
```ts
// d2laundry (investigation2.ts:182)
revise('looseParts', '풀린 부품. 세탁소에 맡겨진 안 사장 점퍼(6/13) 안감의 녹슨 M12 너트 하나와 끊긴 노란 타이.'),
when('d2:binBag', [revise('looseParts', '컨테이너 봉투의 클램프·너트 셋·테이프와, 세탁소 점퍼 안감(6/13)의 녹슨 너트 하나·노란 타이.')]),

// d2scrap (investigation2.ts:255)
revise('looseParts', '풀린 부품. 고철 컨테이너의 달빛공인 전단 봉투: 임시·연결 클램프, 녹슨 너트 셋, 노란 테이프.'),
when('d2:laundryBag', [revise('looseParts', '컨테이너 봉투의 클램프·너트 셋·테이프와, 세탁소 점퍼 안감(6/13)의 녹슨 너트 하나·노란 타이.')]),
```

---

### [P2 / 대사 중복] 문제 2 (구 문제 4). 1일차 옥상(`d1roof`)과 골목(`d1alley`)에서 보강된 필수 대사가 같은 화면의 선택 핫스팟 대사와 중복됨

- **위치 A:** `src/content/ep2/investigation1.ts:337-361` (`bolts`, `tarp`, `tie` 핫스팟) vs `372-373` (`floor` 핫스팟 `'옥상 바닥'`)
  - `'옥상 바닥'`(`372-373`행)의 볼트·타이·방수포·팻말·끈 설명을 `bolts`·`tarp` 핫스팟 확인 여부에 따라 분기해 중복을 방지합니다.
- **위치 B:** `src/content/ep2/investigation1.ts:146-150` (`d1alley.enter`) vs `168-169` (`panel` 핫스팟 `'떨어진 W3 패널'`)
  - `d1alley.enter` 직후 `'떨어진 W3 패널'`을 눌렀을 때 처음 안 사실처럼 반복하지 않도록 어조를 다듬습니다.

---

## 3. 전체 검수 결론

- 디스크 실제 파일 기준 20개 초기 요약(36~65자)과 갱신(`revise`) 요약 전체가 2~3줄 이내로 핵심 사실을 자연스럽게 전달하며, 추론 정답 선공개나 필수 단서 누락 없이 완결되어 있습니다.
- 위 **문제 1**(체크포인트 순회 충돌)과 **문제 2**(1일차 핫스팟 대사 중복) 두 건만 반영되면 최종 통과입니다.
