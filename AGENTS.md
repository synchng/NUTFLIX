# AGENTS.md

AI 코딩 에이전트(Codex 등)와 사람이 이 프로젝트를 수정할 때 따르는 안내입니다. 사용자용 설명은 [README.md](README.md), 검증 기록은 [TEST_RESULTS.md](TEST_RESULTS.md)에 있습니다.

## 프로젝트 한 줄 요약

화면 속 "저사람 누구야?": 넷플릭스풍 홈(NUTFLIX)에서 작품을 고르고, TV(PC 브라우저)로 보다가 화면 속 대상을 휴대폰(웹 리모컨)이나 마우스로 가리키면 영상을 멈추지 않고 정보를 탐색하는 웹 프로토타입입니다. 멀티모달 인터페이스 디자인 과제물이며 UI 문구는 모두 한국어입니다.

작품은 둘입니다(`src/data.ts`의 `titles`, 영상 ID는 `src/logic.js`의 `VIDEOS`).
- **미스터 션샤인** (`sunshine`, tvN DRAMA 공식 하이라이트 `4YTXB5qkGzI`, 약 841초): 인물(→ 배우), 소품, 장소를 가리켜 찾고, OST·촬영지 목록을 함께 보여 줍니다. 홈의 대표 작품입니다.
- **치이카와** (`chiikawa`, 「ちいかわ」 51~55화 `h0vBWdZf2l0`, 약 330초): 캐릭터 → 일본어판 성우 → 공식 프로필 출연작. **이 영상은 2026-11-06 07:59(JST)까지 한정 공개**입니다.

## 명령어

```sh
npm install                 # 처음 한 번
npm run dev                 # 개발 서버 http://localhost:5173 (server.mjs가 Vite를 미들웨어로 띄움)
npm test                    # 판정 로직 테스트 (logic.test.mjs)
npm run test:integration    # 임시 포트에 실제 서버를 띄우는 Socket.IO 통합 테스트
npm run build               # tsc --noEmit + vite build
npm start                   # 빌드 결과를 배포 모드로 실행 (node server.mjs --prod)
```

**작업을 끝내기 전에 반드시 `npm test`, `npm run test:integration`, `npm run build`를 모두 통과시키세요.** 테스트를 지우거나 기대값을 바꿔서 통과시키지 마세요. 의도한 동작이 바뀐 경우에만 테스트를 고치고, 그 이유를 함께 남기세요.

Node.js 22 이상, Windows·macOS 모두 지원합니다. 경로에 한글·공백이 있어도 동작해야 합니다(서버의 파일 경로는 `fileURLToPath` 사용).

## 폴더 구조

| 경로 | 역할 |
|---|---|
| `server.mjs` | Express + Socket.IO 서버. 세션(메모리), 영역 판정, 휴대폰 입력 중계, `/api/regions` 저장, 개발 시 Vite 미들웨어 |
| `src/main.tsx` | 앱 대부분: 플레이어, 정보 패널, TV 선택 피드백(`pulse`), 휴대폰 미리보기 시트(`sheetOpen`), 엔딩 카드, 리모컨(휴대폰) 화면, 장면 편집기 |
| `src/BrowseHome.tsx` | 홈(작품 카드, 인물·소품·장소·OST 줄, 목소리의 주인공), 작품 상세(`TitleDetails`), OST·촬영지(`TitleExtras`) |
| `src/data.ts` | 작품(`titles`), 가리킬 수 있는 대상(`characters`, `kind`: character/person/prop/place), 성우·배우(`actors`), `itemSub`·`itemsOf` |
| `src/workInfo.ts` | 출연작 제목별 공식 클립(`clip`: 캐릭터 PV / 작품 PV), 한국어 표시용 `ko`(`title`, `role`, `summary`)와 소개 원문 링크(`wiki`) |
| `src/WorkClip.tsx` | 출연작 상세 화면. 같은 성우의 다른 출연작으로 이동(`onOpen`) |
| `src/logic.js` + `src/logic.d.ts` | 영상 ID(`VIDEOS`), 대상 id 목록(`characterIds`), 영상별 영역 활성화(`activeRegions(regions, time, video)`)·보간·선택 판정·데이터 검증. 서버와 화면이 함께 씀 |
| `src/RemoteCursor.tsx` | 휴대폰 터치패드 입력으로 PC 화면 전체를 조작하는 가상 커서 (작은 원, 2초 입력이 없으면 숨김, 캐릭터 위에서 링 표시) |
| `src/Modal.tsx` | 공용 모달(포커스 트랩) |
| `src/streaming.css`, `src/style.css` | 스타일. 새 스타일은 `streaming.css` 끝에 설명 주석과 함께 추가 |
| `data/regions.json` | 영역 117개(치이카와 101, 미스터 션샤인 16). 영역마다 `video` 필수 (서버가 시작할 때 읽음) |
| `data/timeline-review.json` | 영역을 만들 때 본 스토리보드 시점 기록 |
| `public/characters`, `public/catalog`, `public/actors`, `public/sunshine` | 이미지와 각 폴더의 `ATTRIBUTION.md`(출처) |
| `logic.test.mjs`, `integration.test.mjs` | 테스트 |

### `src/main.tsx` 길잡이

파일이 크므로 아래 이름으로 찾아가세요.

| 찾을 이름 | 내용 |
|---|---|
| `titleId`, `current`, `openDetails(id)` | TV가 보고 있는 작품(휴대폰은 서버 state의 `video`로 따라감), 작품 상세 열기 |
| `enterWatch(time, id?)` | 재생 화면으로 전환하고 해당 시점부터 재생. 다른 작품이면 `loadVideoById`로 바꾸고 서버에 `video`를 알림 |
| `showUpNext`, `goUpNext` | 엔딩 카드(크레딧 보기 / 상세 정보), 5초 카운트다운, 끝나면 치이카와 상세 열기 |
| `socket.on("selected")`, `socket.on("selection-miss")` | 선택 결과 처리. TV/휴대폰 역할 분담이 여기서 결정됨 |
| `pulse` | 휴대폰으로 선택했을 때 TV 포인터 자리에 0.8초 뜨는 체크·원 확산 |
| `sheetOpen` | 휴대폰 미리보기 시트. 새 선택은 내용만 바꾸고, 상세(`resultOpen`)를 닫으면 다시 보임 |
| `chooseCharacter`, `openActor`, `openLibrary` | 정보 패널 열기 진입점 (`openActor`는 성우 단계로 바로 엶) |
| `infoPanel`, `actor`, `profileWorks`, `allWorks` | 정보 패널 내용(캐릭터 → 성우 → 공식 프로필 출연작, 8개 이후 "모두 보기") |
| `glassPanel`, `library` | 유리 패널 껍데기, 캐릭터 검색 목록 |
| `resultOpenRef` 와 바깥 클릭 `useEffect` | 패널 바깥 클릭으로 닫기 |
| `openWork` | 열려 있는 출연작 상세. 열 때 치이카와 영상을 일시정지 |
| `Editor` | 장면 편집기(영역 그리기, 키프레임, 서버 저장) |

## 데이터 모델

### 가리킬 수 있는 대상 (`src/data.ts` → `characters`)
`Character` 타입: `id`, `title`(작품), `kind`(`character` 애니 캐릭터 · `person` 드라마 인물 · `prop` 소품 · `place` 장소), `name`, `jp`(부제), `voice`(성우 또는 배우 이름, 소품·장소는 빈 문자열), `voiceJp`(`actors`의 키), `image`, `color`, `description`, `voiceSource`, 선택 항목 `voiceImage`, `related`(장면 속 인물 id), `facts`([항목, 값]), `source`(출처 링크).

**캐릭터를 추가하면 `src/logic.js`의 `characterIds`에도 같은 id를 넣어야 합니다.** 서버가 이 목록으로 영역 데이터와 선택 요청을 검증하므로, 빠뜨리면 영역 저장과 선택이 조용히 거부됩니다.

### 성우 (`actors`)
`voiceJp`를 키로 `{ agency, profile?, works: [작품명, 배역][] }`. `works`는 **소속사 공식 프로필에 실린 애니메이션 출연작을 표기 그대로** 옮긴 것이며 치이카와 자체는 뺍니다. 공식 프로필이 없으면 `profile`을 비우고 `works`를 빈 배열로 둡니다(화면은 "크레딧이 나온 영상" 링크를 보여 줌).

### 작품 (`titles`, `VIDEOS`)
`VIDEOS`(logic.js)가 작품별 YouTube 영상 ID이고, `titles`에 제목·장르·소개·길이·엔딩 시작 초(`credits`)·출처, 미스터 션샤인은 `ost`(위키백과 OST 표)와 `locations`(기사 출처가 있는 촬영지), `otherLocations`(위키백과 목록)가 있습니다.

### 영역 (`data/regions.json`)
```json
{ "characterId": "chiikawa", "video": "h0vBWdZf2l0", "startTime": 3, "endTime": 7,
  "boundingBox": { "x": 0.44, "y": 0.1, "width": 0.31, "height": 0.75 },
  "keyframes": [{ "time": 5, "boundingBox": { "x": 0.44, "y": 0.1, "width": 0.31, "height": 0.75 } }] }
```
좌표는 영상 크기 기준 0~1, 시간은 초. `keyframes`는 선택 항목입니다. 형식 검증은 `validRegions`가 합니다.

## 지켜야 할 설계 의도

이 프로젝트는 과제 평가 기준("TV와 리모컨은 같은 정보를 반복하지 않는다", "시청 경험의 변화가 드러나야 한다")에 맞춰 설계되었습니다. 아래 동작은 바꾸지 마세요. 바꿔야 한다면 사용자에게 먼저 확인하세요.

1. **영상은 선택 때문에 멈추지 않습니다.** 예외는 장면 편집기에서 영역을 그릴 때와, 출연작 상세에서 다른 클립을 재생할 때(소리 겹침 방지)뿐입니다.
2. **TV와 휴대폰의 역할을 나눕니다.** 휴대폰으로 선택하면 TV에는 `pulse`(0.8초 체크)만, 미리보기 시트와 상세 탐색은 휴대폰에만 나옵니다. TV에 캐릭터·성우 정보 패널을 띄우거나 선택 때 영상을 멈추지 마세요. 휴대폰 없이 PC 마우스로 선택하면 TV 유리 패널에서 탐색합니다.
3. **빈 곳을 누르면 검색 창을 띄우지 않습니다.** 패널이 열려 있으면 패널만 닫고, 아니면 "앗, 캐릭터가 선택되지 않았어요…" 안내를 띄웁니다.
4. **치이카와 성우는 일본어판 기준이고, 출연작은 공식 프로필 기준입니다.** 위키·팬 사이트·기억으로 출연작을 채우지 마세요.
4-1. **실존 인물은 얼굴로 알아보지 않습니다.** 미스터 션샤인 인물 영역은 배우 이름이 화면에 나오는 장면에만 있습니다. 이름이 나오지 않는 장면에 인물을 추가하려면 사용자가 직접 확인해 장면 편집기로 넣게 하세요. 소품 설명도 이름이 나오지 않는 장면에서는 누가 들고 있는지 단정하지 않습니다.
4-2. **음악은 장면별로 지어내지 않습니다.** OST는 위키백과 표 그대로의 작품 전체 목록이며, 어느 장면에 어떤 곡이 흐르는지는 확인된 자료가 있을 때만 넣으세요.
5. **엔딩이 오면 그 작품의 상세로 이어집니다.** 카운트다운은 5초이고 재생 중일 때만 흐릅니다.
6. **정보는 확인된 것만 넣습니다.** 캐릭터 이름·성우·배역을 추측해서 만들지 마세요. 출처가 없으면 넣지 말고, 넣으면 README의 출처나 `ATTRIBUTION.md`에 남기세요.

## 자주 하는 작업

- **영상 교체(공개 기한 이후 등)**: README의 "7. 영상 바꾸기" 순서를 따르세요. `VIDEO` → `episode` → `regions.json` → (캐릭터가 바뀌면) `characters`·`actors`·`characterIds` → 테스트 시점 순서입니다.
- **캐릭터 추가**: `characters`에 항목 추가 → `characterIds`에 id 추가 → `actors`에 성우(공식 프로필) 추가 → 이미지를 `public/characters`에 넣고 `ATTRIBUTION.md`에 출처 기록 → 영역 추가 → 테스트.
- **영역 추가·수정**: 앱의 장면 편집기에서 그리고 서버 저장하거나, `data/regions.json`을 직접 고칩니다. 대표 장면은 `logic.test.mjs`에 검사를 하나 추가하세요.
- **성우 출연작 갱신**: 공식 프로필을 다시 확인하고 `actors[voiceJp].works`를 표기 그대로 고칩니다. 새 작품의 클립과 한국어 제목·배역·소개(`ko`)는 `workInfo`에 같은 일본어 제목 키로 추가합니다(화면에는 한국어, 원제는 함께 표시). 클립은 **공식 채널 영상만**, 배역 이름이 제목에 있으면 `kind: "character"`, 아니면 `"pv"`로 넣고 삽입 재생이 되는지 확인하세요.
- **문구 수정**: UI는 부드러운 해요체입니다(예: "자세한 정보는 휴대폰에서", "앗, 캐릭터가 선택되지 않았어요"). 기존 문구의 말투에 맞추세요.

## 주의할 점

- **`data/regions.json`은 서버가 시작할 때 한 번만 읽습니다.** 파일을 직접 고쳤거나 `server.mjs`를 바꿨다면 `npm run dev`를 다시 시작하세요. 화면 코드(`src/`)는 Vite가 자동 반영합니다.
- `src/logic.js`를 바꾸면 `src/logic.d.ts`의 타입도 맞춰 주세요.
- 통합 테스트는 `REGION_FILE` 환경변수로 임시 파일을 쓰므로 실제 `data/regions.json`을 바꾸지 않습니다. 테스트에서 실제 데이터 파일을 수정하지 마세요.
- `server.mjs`의 리모컨 입력 이벤트(`ui-move`, `ui-scroll`, `ui-tap`, `ui-center`)는 인증된 휴대폰에서 같은 세션의 PC로만 전달됩니다. 이 검사를 느슨하게 만들지 마세요.
- YouTube는 IFrame Player API로만 재생합니다. 영상 다운로드·스트림 추출은 하지 마세요.
- 이미지와 영상의 권리는 각 권리자에게 있습니다. 새 자산을 넣으면 출처를 꼭 기록하세요.
- 기능을 바꾸면 README와 TEST_RESULTS.md도 현재 상태에 맞게 고치세요.

## 코드 스타일

- TypeScript + React 함수 컴포넌트. 상태는 `main.tsx`의 `App` 안에 있으므로 새 기능도 기존 패턴(상태 + 이벤트 핸들러)을 따르세요.
- 새 의존성은 꼭 필요할 때만 추가하세요. 기존 의존성: react, socket.io(-client), express, qrcode, lucide-react(아이콘), tailwindcss, vite.
- 주석은 "왜 그렇게 했는지"만 짧게. 기존 파일의 밀도에 맞추세요.
