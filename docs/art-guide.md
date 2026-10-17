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
| `narae` | 신나래 (조수) | 오른쪽을 봄 | `normal`, `angry`, `surprised` |
| `eom` | 엄정한 (검사) | 왼쪽을 봄 | `normal`, `shock`, `smug` |
| `judge` | 고민중 (재판장) | 정면 | `normal`, `surprised`, `stern` |
| `soonja` | 박순자 (피고인) | 정면 | `normal`, `shock`, `sad` |
| `haeun` | 박하은 (증인) | 정면 | `normal`, `sad`, `shock` |

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
| `seo` | 서지훈 (누리랩 기술이사) | 정면 | `normal`, `sweat`, `proud` |
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

지금 들어 있는 그림 13장은 아래 방식으로 Codex CLI가 만들었어요. 새 표정이나 캐릭터를 추가할 때는 이 문서에 먼저 적고 같은 방식으로 요청하면 돼요.

```bash
codex exec --skip-git-repo-check -s workspace-write "Read docs/art-guide.md. Using your image generation tool, create src/assets/chars/soonja/shock.png using src/assets/chars/soonja/normal.png as the reference image. Character PNGs must be 1024x1536 with a real alpha-transparent background. Only write inside src/assets/."
```

다음에 있으면 좋은 그림:
- `dan/confident` — 모순을 찌른 뒤 여유 있게 웃는 강단비

## 표정을 늘릴 때

1. `normal.png`를 먼저 만들어요.
2. 다른 표정은 `normal.png`를 **참조 이미지로 넣고** "같은 캐릭터, 같은 옷, 같은 화풍으로 표정과 자세만 바꿔줘"라고 요청해요. 그래야 얼굴이 바뀌지 않아요.
3. 게임 스크립트에서 `emo: '<표정>'`으로 불러요.
