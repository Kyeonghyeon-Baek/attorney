# 「판 뒤집기」 그림 에셋 가이드

Codex(이미지 생성)나 직접 그린 그림을 게임에 넣을 때 쓰는 규칙이에요.
파일을 정해진 경로에 넣기만 하면 게임이 자동으로 인식해요. 파일이 없으면 임시 실루엣이 대신 나와요.

## 파일 규칙

| 종류 | 경로 | 크기 | 배경 |
|---|---|---|---|
| 캐릭터 | `src/assets/chars/<캐릭터ID>/<표정>.png` | 1024×1536 (세로) | **투명** |
| 법정 배경 | `src/assets/bg/<위치>.png` | 1536×1024 (가로) | 불투명 |

- 캐릭터는 **허리 위 반신**. 머리 꼭대기가 위에서 6~10% 지점, 허리가 아래쪽 끝에 걸리게.
- 배경에는 **사람과 책상을 그리지 않아요.** 책상은 게임이 앞에 따로 그려요.
- 표정 파일이 없으면 같은 캐릭터의 `normal.png`로 대체돼요.

## 공통 스타일 (모든 프롬프트 앞에 붙이기)

```
Original character art for a Korean courtroom adventure game set in near-future Seoul (2031).
Clean, confident anime-style line art with Korean webtoon sensibility, flat cel shading with
two tones, slightly muted palette with crisp highlights. Waist-up character sprite, centered,
full head visible, cut off at the waist at the bottom edge. Transparent background, no text,
no logo, no frame.
```

## 캐릭터

| ID | 이름 | 방향 | 표정 파일 |
|---|---|---|---|
| `dan` | 강단비 (변호사) | 오른쪽을 봄 | `normal`, `point`, `sweat` |
| `narae` | 신나래 (조수) | 오른쪽을 봄 | `normal`, `angry`, `surprised`, `happy` |
| `eom` | 엄정한 (검사) | 왼쪽을 봄 | `normal`, `shock`, `smug` |
| `judge` | 고민중 (재판장) | 정면 | `normal`, `surprised`, `stern` |
| `soonja` | 박순자 (피고인) | 정면 | `normal`, `shock`, `sad` |
| `haeun` | 박하은 (증인) | 정면 | `normal`, `sad`, `shock`, `smile` |

다온(AI)은 게임이 직접 그려요(모니터 속 빛나는 원). 그림이 필요 없어요.

### dan — 강단비
```
Kang Danbi, a rookie Korean public defender in her late 20s. Short black bob with blunt bangs,
determined dark eyes, a slight frown of focus. Dark indigo two-piece suit, white shirt, small gold
lawyer's pin on the lapel. 3/4 view facing to the right side of the image.
```
- `normal`: 두 손을 책상 위에 짚은 듯한 자세, 결연한 표정
- `point`: 오른쪽을 향해 팔을 쭉 뻗어 검지로 가리킴, 입을 크게 벌리고 외치는 순간
- `sweat`: 식은땀 한 방울, 당황해서 입꼬리가 굳은 표정, 한 손으로 뒷머리를 만짐

### narae — 신나래
```
Shin Narae, 19, youngest daughter of a family of Korean shamans. Long black hair in a single braid
tied with a red silk daenggi ribbon. Modern oversized hoodie with saekdong (Korean rainbow-stripe)
sleeves, a small brass shaman bell keychain. Lively, cheeky expression. 3/4 view facing right.
```
- `normal`: 장난스럽게 웃는 얼굴
- `angry`: 볼을 부풀리고 눈썹을 찌푸린 채 팔짱을 낌. 화났지만 귀여운 느낌
- `surprised`: 눈을 동그랗게 뜨고 입을 벌림, 한 손을 입가에 댐
- `happy`: 눈물이 맺힌 채 활짝 웃으며 두 주먹을 불끈 쥠

### eom — 엄정한
```
Eom Jeonghan, an elite Korean prosecutor in his early 30s. Slicked-back black hair, sharp jaw,
thin rimless smart glasses with a faint cyan AR glint on the lens. Charcoal three-piece suit,
silver tie pin. Cold, composed, slightly arrogant. 3/4 view facing to the left side of the image.
```
- `normal`: 한 손가락으로 안경을 밀어 올리는 자세
- `shock`: 충격으로 몸을 뒤로 젖힘, 안경이 비뚤어지고 식은땀
- `smug`: 한쪽 입꼬리만 올린 비웃음, 턱을 살짝 들고 내려다보는 시선, 팔짱

### judge — 고민중
```
Judge Go Minjung, a kind but indecisive Korean judge in his 60s. Round face, bald head with grey
side hair, bushy grey eyebrows, small round glasses. Black judicial robe with a deep purple front
band. Holding a wooden gavel. Facing the viewer.
```
- `normal`: 온화하게 고민하는 표정
- `surprised`: 눈이 휘둥그레지고 눈썹이 치솟음
- `stern`: 눈썹을 모으고 입을 굳게 다문 엄한 얼굴, 의사봉을 쥔 손에 힘이 들어감

### soonja — 박순자
```
Park Soonja, 52, a veteran call-center team leader who was just laid off. Short permed hair with
a few grey strands, tired but warm eyes, faint smile lines. Beige knit cardigan over a plain
blouse. Dignified despite exhaustion. Facing the viewer.
```
- `normal`: 지쳤지만 따뜻하게 미소 지음
- `shock`: 눈을 크게 뜨고 숨을 들이켬, 두 손으로 입을 가림
- `sad`: 눈가가 젖은 채 시선을 아래로 떨굼, 입술을 꾹 다묾. 미소 없음

### haeun — 박하은
```
Park Haeun, 22, a Korean university student who secretly works night shifts pretending to be an
AI chat agent. Same warm eyes and face shape as her mother Park Soonja, black hair tied back in a
low ponytail with loose strands, tired eyes. Grey sweatshirt under a black padded vest, a call-center
headset hanging around her neck, an outsourcing company ID lanyard. Facing the viewer.
```
- `normal`: 긴장해서 어깨를 움츠리고 시선을 살짝 피함
- `sad`: 눈물이 맺힌 채 입술을 깨묾
- `shock`: 눈을 크게 뜨고 두 손을 가슴께에 모음
- `smile`: 눈가가 살짝 젖었지만 밝게, 안도한 작은 미소

## 법정 배경

공통:
```
Interior of a modern Korean courtroom in 2031, warm walnut wood paneling, soft overhead light,
subtle holographic display panels built into the walls. Empty, no people, no desks in the
foreground, no text. Anime background art style, painterly, slightly muted colors. 1536x1024.
```

| 파일 | 내용 |
|---|---|
| `bg/defense.png` | 변호인석 뒤쪽 벽. 오른쪽으로 비스듬히 본 시점 |
| `bg/prosecution.png` | 검사석 뒤쪽 벽. 왼쪽으로 비스듬히 본 시점 |
| `bg/witness.png` | 증언대 뒤쪽 벽. 정면, 가운데가 비어 있음 |
| `bg/judge.png` | 재판장석 뒤 높은 벽. 정면, 가운데 위쪽에 가상의 원형 법원 문장(저울 모티프, 실제 기관 문장 아님) |
| `bg/lounge.png` | 법원의 피고인 대기실. 베이지색 벽, 긴 나무 벤치, 정수기, 블라인드 친 창문, 벽시계, 형광등. 텅 빈 오후. 정면, 가운데가 비어 있음 |

## 조사 파트

### 캐릭터

| ID | 이름 | 방향 | 표정 파일 |
|---|---|---|---|
| `seo` | 서지훈 (누리랩 기술이사) | 정면 | `normal`, `sweat`, `proud`, `cornered`, `rage`, `breakdown` |
| `gu` | 구만두 (형사) | 정면 | `normal`, `panic` |

#### seo — 서지훈
```
Seo Jihun, 38, CTO of a Korean AI startup. Neat undercut hairstyle, clean-shaven, tired eyes
behind a polite professional smile. Black turtleneck under a light grey blazer, a company ID
lanyard, a slim smartwatch. Facing the viewer.
```
- `normal`: 정중하게 미소 짓지만 어딘가 긴장한 얼굴
- `sweat`: 억지 미소, 관자놀이에 식은땀, 시선을 살짝 피함
- `proud`: 자신감 넘치는 미소, 한 손을 가슴에 얹고 턱을 살짝 듦
- `cornered`: 식은땀, 억지 미소가 일그러지고 시선이 흔들림, 한 손으로 목줄을 움켜쥠, 안경이 살짝 비뚤어짐
- `rage`: 입을 크게 벌려 소리침, 관자놀이에 핏대, 주먹을 치켜듦, 머리가 흐트러지기 시작함
- `breakdown`: 완전히 무너짐. 고개를 떨구고 어깨가 축 처짐, 금이 간 안경이 흘러내림, 머리가 헝클어짐, 떨리는 두 손 (허리 위 구도 유지)

#### gu — 구만두
```
Detective Gu Mandu, a big-hearted Korean police detective in his 40s. Large build, short messy
hair, light stubble, rumpled beige trench coat over a white shirt with a loosened tie. Holding
a half-eaten steamed dumpling. Friendly, a little clumsy. Facing the viewer.
```
- `normal`: 만두를 든 채 사람 좋게 웃음
- `panic`: 허둥지둥, 만두를 떨어뜨릴 뻔하며 땀을 흘림

### 조사 배경

법정 배경과 같은 규칙(1536×1024, 사람 없음, 글자 없음). 조사 포인트가 될 물건은 **크게, 서로 떨어뜨려서** 그려야 클릭하기 좋아요.

```
Background art for a Korean investigation adventure game set in near-future Seoul (2031).
Painterly anime background style, slightly muted colors. Empty, no people, no readable text,
no logos. 1536x1024, eye-level view.
```

| 파일 | 내용 |
|---|---|
| `bg/lobby.png` | 판교 AI 스타트업의 밝은 로비. 가운데 왼쪽에 접수대와 그 위의 소개서 거치대, 오른쪽 벽에 빛나는 청록색 구체가 떠 있는 대형 화면, 맨 오른쪽에 사원증으로 여는 보안 게이트, 왼쪽 위 천장에 돔형 CCTV |
| `bg/callcenter.png` | 사람이 다 떠난 콜센터. 헤드셋만 남은 책상들이 뒤로 줄지어 있음. 앞쪽 가운데 왼쪽에 팀장 책상(명패, 액자, 모니터에 붙은 포스트잇, 컵라면 용기), 뒤쪽 벽에 실적 보드, 오른쪽에 회색 철제 보관함. 해 질 녘 빛 |
| `bg/serverroom.png` | 서버실 사건 현장. 양옆에 서버랙, 가운데 통로. 왼쪽 랙에 노란 폴리스 라인, 가운데 왼쪽 바닥 근처 랙 모서리에 번호 감식 표지, 오른쪽에 카드 리더가 달린 문, 가운데 오른쪽 랙 위에 파란 불이 켜진 작은 원형 마이크 모듈. 차가운 파란 조명 |

## 증거 그림

| 경로 | 크기 | 배경 |
|---|---|---|
| `src/assets/items/<증거ID>.png` | 1024×1024 | **투명** |

공통:
```
Item illustration for a Korean courtroom adventure game, same clean anime-style line art and
flat two-tone cel shading as the character sprites. A single object, centered, slight 3/4
top-down angle, soft contact shadow, transparent background. No readable text or numbers:
use abstract grey lines wherever writing would be.
```

| ID | 그림 |
|---|---|
| `access` | 검은 태블릿 보드에 끼운 출입 기록 출력지, 위쪽에 작은 사원증 아이콘 |
| `autopsy` | 클립보드에 꽂힌 부검 소견서, 사람 윤곽 도식과 붉은 도장 |
| `cardReturn` | 반납 확인서 위에 놓인 흰 사원증(빈 사진 칸, 목줄), 붉은 원형 도장 |
| `brochure` | 반짝이는 3단 회사 소개서, 표지에 짙은 남색 바탕의 청록색 빛나는 구체 |
| `chatLog` | 길게 늘어진 상담 기록 출력지, 말풍선 블록들, 한 줄에 빨간 형광펜 |
| `contract` | 붉은 인감 도장과 서명란이 있는 두 장짜리 계약서, 옆에 만년필 |
| `micSpec` | 도면이 그려진 사양서와 그 옆의 작은 원반형 마이크 모듈(파란 고리 불빛) |
| `parking` | 지하 주차장 출차 기록 출력지, 작은 자동차 실루엣과 빈 번호판 모양 사각형 |
| `settingsLog` | 관리자 설정 화면이 떠 있는 태블릿, 빨간색으로 꺼진 토글 스위치, 작은 서버 아이콘과 기록 줄 |
| `badge` | 투명한 경찰 증거 봉투에 담긴 흰 사원증(목줄 포함), 봉투에 빨간 꼬리표 |

## 인물 사진

법원기록의 인물 탭은 캐릭터 그림의 얼굴 부분을 잘라 보여 줘요. 캐릭터 그림이 없는 인물만 따로 사진을 만들어요.

| 경로 | 크기 | 배경 |
|---|---|---|
| `src/assets/portraits/<인물ID>.png` | 1024×1024 | 불투명 (옅은 회색 단색) |

- `victim` — 한도윤 (41, 누리랩 대표, 피해자):
```
ID-photo style head-and-shoulders portrait of Han Doyun, 41, CEO of a Korean AI startup. Neat short
black hair, clean-shaven, confident but kind eyes, navy suit with an open-collar white shirt.
Plain light grey background, facing the viewer. Same anime illustration style as the sprites.
```

## Codex로 한 번에 만들기

4화 그림은 아래 방식으로 Codex CLI가 만들었어요. 1화 그림 28장은 캐릭터 둘 / 배경·CG / 증거로 나눠 Codex 네 개를 동시에 돌려 10분 남짓 걸렸어요. 새 표정이나 캐릭터를 추가할 때는 이 문서에 먼저 적고 같은 방식으로 요청하면 돼요.

```bash
codex exec --skip-git-repo-check -s workspace-write "Read docs/art-guide.md. Using your image generation tool, create src/assets/chars/soonja/shock.png using src/assets/chars/soonja/normal.png as the reference image. Character PNGs must be 1024x1536 with a real alpha-transparent background. Only write inside src/assets/."
```

다음에 있으면 좋은 그림:
- `dan/confident` — 모순을 찌른 뒤 여유 있게 웃는 강단비

## 표정을 늘릴 때

1. `normal.png`를 먼저 만들어요.
2. 다른 표정은 `normal.png`를 **참조 이미지로 넣고** "같은 캐릭터, 같은 옷, 같은 화풍으로 표정과 자세만 바꿔줘"라고 요청해요. 그래야 얼굴이 바뀌지 않아요.
3. 게임 스크립트에서 `emo: '<표정>'`으로 불러요.

---

# 제1화 「무인(無人)의 밤」

2031년 3월, 마포구 골목의 무인 편의점 "오롯24". 매장 색은 **코랄(산호색)과 남색**이에요. 로고는 글자 없는 단순한 원형 마크로만 그려요. 실제 편의점 브랜드와 닮지 않게 해요.

## 캐릭터

| ID | 이름 | 방향 | 표정 파일 |
|---|---|---|---|
| `taeo` | 신태오 (피고인) | 정면 | `normal`, `sad`, `shock`, `smile` |
| `oh` | 오정택 (본사 슈퍼바이저, 진범) | 정면 | `normal`, `sweat`, `shock`, `cornered`, `rage`, `breakdown`, `smug` |
| `malsun` | 조말순 (폐지 줍는 할머니) | 정면 | `normal`, `smile`, `sad` |
| `dan` | 강단비 | 오른쪽 | 추가: `confident` |
| `narae` | 신나래 | 오른쪽 | 추가: `sad` |

### taeo — 신태오
```
Shin Taeo, 24, a gentle, soft-spoken young Korean man who works the night shift at an unmanned
convenience store. Tall and lanky, slightly messy dark hair falling over his eyes, sleepy kind
eyes with faint dark circles. Faded navy hoodie under a coral staff vest with navy trim and a
plain round logo patch (no text), a small adhesive bandage on one finger. Facing the viewer.
```
- `normal`: 어깨를 움츠리고 미안한 듯 작게 웃음
- `sad`: 시선을 떨구고 입술을 깨묾, 눈물이 맺힘
- `shock`: 눈을 크게 뜨고 입을 벌림, 두 손을 가슴께에서 멈춤
- `smile`: 뒷머리를 긁으며 쑥스럽게, 안도한 따뜻한 웃음

### oh — 오정택
```
Oh Jeongtaek, 41, a slick franchise-headquarters supervisor. Glossy, heavily pomaded 2:8 side-parted
black hair, thin neat mustache, narrow fox-like eyes, a polished salesman smile. Slim-fit navy suit,
white shirt, coral tie, a navy lanyard with a white ID card, a chunky black smartwatch with a
glowing cyan screen clearly visible on his left wrist, holding a thin work tablet. Facing the viewer.
```
- `normal`: 매끈한 영업용 미소, 한 손으로 넥타이를 고쳐 맴, 다른 손엔 태블릿
- `sweat`: 미소가 굳은 채 식은땀, 곁눈질로 손목의 스마트워치를 봄
- `shock`: 몸을 뒤로 젖히며 눈이 튀어나올 듯, 2:8 앞머리 한 가닥이 툭 빠짐
- `cornered`: 이를 악물고 다른 손으로 스마트워치를 움켜쥠, 땀범벅, 앞머리가 몇 가닥 흘러내림
- `rage`: 태블릿을 치켜들고 소리침, 관자놀이에 핏대, 머리가 반쯤 무너짐
- `breakdown`: 2:8 머리가 완전히 무너져 헝클어짐, 넥타이가 풀림, 금이 간 스마트워치 화면이 빨갛게 빛남, 어깨가 축 처져 고개를 떨굼 (허리 위 구도 유지)
- `smug` (R4): 검지를 세워 "핵심 한 가지"를 짚는 발표 자세, 다른 손엔 태블릿, 여우 같은 자기만족 미소. 왼손목 스마트워치가 보이게

### malsun — 조말순
```
Jo Malsun, 81, a tiny, slightly stooped Korean grandmother who collects scrap cardboard at night.
Deeply wrinkled warm face, squinting kind eyes, short grey permed hair under a knitted wool hat.
Flower-patterned quilted vest over a faded sweater, white cotton work gloves. Facing the viewer.
```
- `normal`: 눈을 가늘게 뜨고 온화하게 웃음
- `smile`: 이가 하나 빠진 채 활짝 웃음, 두 손을 모음
- `sad`: 장갑 낀 손으로 눈가를 훔침, 입을 꾹 다묾

### dan / narae 추가 표정
- `dan/confident`: 팔짱을 끼고 한쪽 입꼬리를 올린 여유 있는 미소, 모순을 찌른 뒤의 얼굴
- `narae/sad`: 눈물을 글썽이며 소매로 눈가를 누름, 입술이 떨림

### R4에서 추가한 표정 (Codex, 각 캐릭터의 normal.png를 참조 그림으로)
- `dan/shock`: 몸을 뒤로 젖히고 눈이 커짐, 두 손을 가슴 앞에 든 채 숨을 들이켬. 오른쪽을 봄
- `gu/eat`: 만두를 통째로 입에 물어 볼이 빵빵, 들킨 듯 동그란 눈, 다른 손엔 먹다 만 만두
- `gu/serious`: 손에 만두가 없음. 한 손으로 넥타이를 고쳐 매며 눈썹을 내린 진짜 형사의 얼굴 (만두를 내려놓는 순간에 쓴다)
- `judge/smile`: "허허" 웃음. 눈이 초승달처럼 감기고 턱을 쓰다듬음, 의사봉은 쥔 채
- `eom/sweat`: 드문 당황. 안경을 밀어 올리지만 살짝 비뚤어지고, 관자놀이에 식은땀 한 방울, 시선을 피함

## 배경 (1536×1024, 사람 없음, 글자 없음)

| 파일 | 내용 |
|---|---|
| `bg/storeroom.png` | 밤, 무인 편의점의 좁은 창고. 양옆에 음료 상자와 컵라면 상자가 쌓인 철제 선반, 가운데 앞쪽에 회색 플라스틱 폐기함, 오른쪽 안쪽에 밀대가 달린 철문(뒷문), 천장 카메라는 그리지 않는다(EP1-R5: 일반 창고 배경을 CAM3 시점처럼 읽히지 않게. CAM3 화면은 `cg/cctv3.png`). 왼쪽 안쪽 구석은 키 큰 선반 뒤로 짙은 그림자. 형광등 하나만 켜진 차가운 빛 |
| `bg/office.png` | 법원 별관의 창문 없는 국선변호인 사무실. 서류 상자와 사건 기록이 쌓인 책상 두 개, 낡은 전기포트와 컵라면, 화이트보드, 작은 화분 하나, 벽에 붙은 달력(글자 없음). 늦은 오후 형광등 빛, 가운데가 비어 있음 |

## 이벤트 CG

| 경로 | 크기 | 배경 |
|---|---|---|
| `src/assets/cg/<id>.png` | 1536×1024 (가로) | 불투명. **사람이 나와도 돼요** |

공통:
```
Event illustration (CG) for a Korean courtroom adventure game set in near-future Seoul (2031).
Same clean anime-style line art and flat two-tone cel shading as the character sprites, cinematic
composition, painterly lighting. No readable text, no logos, no frame. 1536x1024.
```

| ID | 그림 |
|---|---|
| `cctv` | 천장 구석 감시 카메라 시점(살짝 어안 렌즈)으로 내려다본 밤의 작은 무인 편의점. 가운데 오른쪽에서 코랄색 조끼를 입은 키 큰 청년이 냉장 진열대에 삼각김밥을 채우는 중. 앞쪽 유리문 밖은 내려간 철제 셔터. 형광등, 무인 계산대. 사람은 그 청년 한 명뿐 |
| `watchglow` | 어두운 창고 안, 아래에서 올려다본 남자 얼굴의 클로즈업. 빛은 손목 스마트워치 화면의 차가운 청록색뿐. 기름 바른 2:8 가르마, 가는 콧수염, 땀. 뒤로 철제 선반. 화면 아래 구석 바닥에 움직이지 않는 나이 든 남자의 손(피 없음). 오싹한 분위기 |
| `cctv3` (R4) | CAM3 시점(천장 돔 카메라, 약한 어안)으로 내려다본 밤의 창고 오른쪽 통로. 코랄 조끼의 청년이 검은 비닐봉지를 들고 안쪽으로 걸어감. 왼쪽은 천장까지 닿는 선반이 시야를 막고, 통로 끝은 벽에서 왼쪽 어둠으로 꺾임. **뒷문은 보이지 않아야 한다**(CAM3는 뒷문을 못 본다). 화면 UI는 게임이 얹음 |
| `shutter` (R4) | 밤, 앞길에서 본 오롯24 정문. 구멍 없는 철제 셔터가 끝까지 내려가 있고 가운데 흰 안내문 한 장(글자 없음). 위쪽 코랄·남색 간판에 글자 없는 원형 마크. 젖은 아스팔트, 가로등, 전봇대. 사람 없음 |
| `alley` | 편의점 뒤 밤 골목, 따뜻한 가로등 아래. 코랄색 조끼의 키 큰 청년이 입구가 열린 **검은 불투명 비닐봉지**(포장된 삼각김밥 윗부분만 살짝 보임)를 작은 할머니에게 건넴. 할머니 옆에는 납작하게 접은 박스를 높이 실은 손수레. 뒤는 이웃 건물의 무늬 없는 벽. **가게 뒷문은 그리지 않는다**(두 사람은 뒷문에서 약 50m 떨어진 가로등 밑. 문이 꼭 보여야 하면 먼 배경의 작은 닫힌 철문). 다정하고 고요한 분위기 (EP1-R5에서 기존 그림을 편집: 열린 문과 투명 봉지 제거) |

## 증거 그림 (1024×1024, 투명 배경)

| ID | 그림 |
|---|---|
| `iguardLog` | 감시 카메라 화면이 떠 있는 태블릿. 화면 속 작은 사람 실루엣 둘레에 빨간 감지 상자, 그 아래 기록 줄 목록 |
| `scenePhoto` | 경찰 현장 사진(인화지). 어두운 창고 구석 바닥의 흰 테이프 윤곽선, 노란 번호 표지, 철제 선반 모서리 |
| `shutterPhoto` | 인화한 사진. 밤에 내려간 편의점 철제 셔터와 거기 테이프로 붙인 흰 안내문 한 장 |
| `layout` | 작은 매장 평면도 청사진. 카메라 아이콘 네 개와 부채꼴 시야 범위, 그중 하나(뒷문 쪽)는 빨간 X로 지워짐 |
| `call112` | 클립보드에 끼운 통화 녹취록 출력지, 위쪽에 수화기 아이콘, 한 줄에 빨간 밑줄 |
| `samgak` | 비닐 포장된 삼각김밥 두 개가 든 작은 비닐봉지, 포장에 빨간 원형 스티커 |
| `recorder` | 작은 은색 디지털 녹음기, 빨간 녹음 불빛, 살짝 긁힌 자국 |
| `doorLog` | 철문에 달린 검은 디지털 도어락(숫자 키패드, 작은 화면)과, 그 아래로 길게 늘어진 영수증 같은 기록 출력지. 출력지 한 줄에 빨간 동그라미 |
| `sceneItems` | 투명한 경찰 증거 봉투 **한 개**에 담긴, 받침에서 통째로 빠진 두꺼운 직사각형(세로 3:4) 투명 아크릴 상패 판 본체(오정택 가방에서 확보). 판은 대부분 온전하고 **정면 기준 왼쪽 아래 모서리만** 불규칙하게 깨져 없다(왼쪽 변 아래 약 1/5 지점에서 아랫변 약 1/4 지점까지, `engine/photos.ts`의 `PLATE_NOTCHED`와 같은 자리). 나머지 세 모서리는 직각. 금속 받침·받침의 밑동·작은 파편은 그리지 않는다(받침과 현장 조각은 현장, 상처 속 조각은 부검에서 따로 확보했다). 빨간 꼬리표는 회색 막대만, 읽을 수 있는 글자·숫자 없음 (EP1-R5) |
| `watchLog` | 화면이 켜진 검은 사각 스마트워치. 화면에 청록색 심박수 그래프가 있고, 뾰족하게 솟은 봉우리 두 개가 빨갛게 표시됨. 화면 한쪽 위에 작은 와이파이 아이콘 |

## 조사 화면 배경 (R4)

| ID | 그림 |
|---|---|
| `bg/bagTable` | 법정 증거대의 짙은 초록 펠트를 70도쯤 위에서 본 그림. 오른쪽에 구겨진 검은 비닐봉지(바닥 모서리에 녹음기만 한 딱딱한 사각형이 비닐을 밀어 불룩함, 녹음기 자체는 안 보임), 왼쪽에 서로 떨어뜨린 삼각김밥 셋(빨간 스티커 둘, 주황 하나)과 바나나맛 우유 한 병(상표 없음), 아래쪽에 빨간 끈 증거 꼬리표. 위 15%·아래 30%는 비워 둠(UI 자리). 조사 지점 좌표는 `tape.ts`의 `examine('bagTable', …)`, `?spots`로 확인 |

## 사진 세트 배경 (`src/assets/photos/`, 1536×1024, 불투명)

같은 장면을 여러 장 찍은 "사진"은 배경을 한 장만 그리고, 장마다 달라지는 물건은 게임이 SVG로 얹어요(`src/engine/photos.ts`). 그래서 모든 장의 구도·조명·크기가 똑같아요. 배경에는 바뀌는 물건을 그리지 말고, 그 물건이 놓일 자리를 비워 두게 해요.

| ID | 그림 |
|---|---|
| `injury-chart` (R4.1) | 부검 양식에 인쇄된 인체 도식. 1024×1536, 크림색 모눈 종이와 얇은 이중 테두리, 짙은 갈색 의료 선화에 옅은 회색 채움. 앞모습, 팔을 몸에서 조금 떼고 손바닥은 앞으로. 평범한 성인 남성 체형(피해자 57세 남성), 얼굴·머리카락·상처·표시·글자 없음. 번호 고리는 게임이 얹는다(`engine/figures.ts`의 좌표: 정수리 왼쪽, 오른손목, 왼쪽 옆구리). 다시 그리면 좌표를 다시 잰다 |
| `share112-base` | 창고 책상 뒤 벽에 기대 세운 휴대전화가 찍은 밤의 정지 사진. 아래쪽은 어두운 호두나무 책상(펼친 장부, 볼펜, 구겨진 영수증 둘), 가운데 오른쪽 책상 앞 가장자리에 **비어 있는** 직사각형 금속 상패 받침(위에 가는 홈). 책상 앞 가장자리 너머 위쪽은 반질반질한 회색 바닥 타일(가운데·왼쪽은 비워 둠), 오른쪽 위에 코랄·남색 상자 모서리, 왼쪽 위 어둠, 맨 위에 손수레 바퀴. 사람·손·글자·숫자 없음. 아크릴 판도 그리지 않는다(게임이 얹음) |

Codex에 넘긴 프롬프트는 "스마트폰 사진 같은 틀: 약한 광각, 은은한 비네팅, 옅은 센서 노이즈, 차가운 형광등"을 storeroom.png 화풍과 함께 요구했어요. 다시 그리면 `photos.ts`의 받침 슬롯 좌표(x 1059–1180, y 547–570)와 떨어진 판의 자리를 새 그림에 맞춰 고쳐야 해요.

## 인물 사진

- `bang` — 방대식 (57, 오롯24 점주, 피해자):
```
ID-photo style head-and-shoulders portrait of Bang Daesik, 57, a gruff but kind Korean convenience
store owner. Square face, short grey crew cut, thick dark eyebrows, deep frown lines, a faded
brown fleece vest over a checked shirt. Plain light grey background, facing the viewer. Same anime
illustration style as the sprites.
```
