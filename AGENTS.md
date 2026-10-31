# AGENTS.md

AI 코딩 에이전트(Codex 등)와 사람이 이 프로젝트를 수정할 때 따르는 안내입니다. 사용자용 설명은 [README.md](README.md), 검증 기록은 [TEST_RESULTS.md](TEST_RESULTS.md)에 있습니다.

## 프로젝트 한 줄 요약

화면 속 "저사람 누구야?": TV(PC 브라우저)에서 애니메이션을 보다가 영상 속 캐릭터를 휴대폰(웹 리모컨)이나 마우스로 가리키면, 영상을 멈추지 않고 캐릭터 → 성우 → 같은 목소리의 다른 작품을 탐색하는 넷플릭스풍 웹 프로토타입(NUTFLIX)입니다. 멀티모달 인터페이스 디자인 과제물이며 UI 문구는 모두 한국어입니다.

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
| `src/main.tsx` | 앱 대부분: 플레이어, 정보 패널, TV 작은 카드, 다음 화, 리모컨(휴대폰) 화면, 장면 편집기 |
| `src/BrowseHome.tsx` | 홈 화면, 치이카와 상세(`TitleDetails`), 작품 상세(`WorkDetails`), 출연작 상세(`KoWorkDetails`) |
| `src/data.ts` | 캐릭터·작품·에피소드·한국어판 성우·홈 선반 데이터 |
| `src/logic.js` + `src/logic.d.ts` | 영역 활성화·보간·선택 판정·데이터 검증. 서버와 화면이 함께 씀 |
| `src/RemoteCursor.tsx` | 휴대폰 터치패드 입력으로 PC 화면 전체를 조작하는 가상 커서 |
| `src/Modal.tsx` | 공용 모달(포커스 트랩) |
| `src/streaming.css`, `src/style.css` | 스타일. 새 스타일은 `streaming.css` 끝에 설명 주석과 함께 추가 |
| `data/regions.json` | 캐릭터 영역 259개 (서버가 시작할 때 읽음) |
| `data/timeline-review.json` | 51화 영역을 만들 때 관찰한 시점 기록 |
| `public/characters`, `public/catalog`, `public/actors` | 이미지와 각 폴더의 `ATTRIBUTION.md`(출처) |
| `logic.test.mjs`, `integration.test.mjs` | 테스트 |

### `src/main.tsx` 길잡이

파일이 2,000줄이 넘습니다. 아래 이름으로 찾아가세요.

| 찾을 이름 | 내용 |
|---|---|
| `enterWatch(time, video)` | 재생 화면으로 전환하고 영상 교체(`loadVideoById`). 다른 영상 재생은 항상 이 함수로 |
| `playlist`, `next`, `showUpNext`, `goUpNext` | 다음 화 순서, 엔딩 카드, 5초 카운트다운, 마지막 영상 뒤 작품 상세 열기 |
| `socket.on("selected")`, `socket.on("selection-miss")` | 선택 결과 처리. TV/휴대폰 역할 분담이 여기서 결정됨 |
| `tvChip` | 휴대폰으로 선택했을 때 TV에 6초간 뜨는 작은 카드 |
| `chooseCharacter`, `openActor`, `showWork`, `openLibrary` | 정보 패널 열기 진입점 |
| `infoPanel`, `glassPanel`, `workButtons`, `koRoles`, `titleCast` | 정보 패널 내용(캐릭터 → 성우 → 출연작), 캐릭터 검색 목록 |
| `resultOpenRef` 와 바깥 클릭 `useEffect` | 패널 바깥 클릭으로 닫기 |
| `Editor` | 장면 편집기(영역 그리기, 키프레임, 서버 저장) |

## 데이터 모델

### 캐릭터 (`src/data.ts` → `characters`)
`Character` 타입: `id`, `name`, `jp`, `voice`(일본어판 성우), `voiceJp`, `image`, `color`, `description`, `voiceSource`, 선택 항목 `voiceImage`(성우 사진), `work`(작품 인덱스, 치이카와 캐릭터는 없음), `koName`(한국어판 이름).

**캐릭터를 추가하면 `src/logic.js`의 `characterIds`에도 같은 id를 넣어야 합니다.** 서버가 이 목록으로 영역 데이터와 선택 요청을 검증하므로, 빠뜨리면 영역 저장과 선택이 조용히 거부됩니다.

### 영상
- 치이카와 에피소드: `episodes` (`video`, `number`, `title`, `credits`(엔딩 시작 초), `dub`(캐릭터 id → 그 화의 한국어판 성우))
- 다른 작품: `works` (`video`, `videoLabel`, `credits` 등)
- 홈 선반 출연작: `koFeatured` (`video`, `cast`는 `koActors`에서 자동 계산)
- `CHIIKAWA` 상수 = 51화 영상 ID. `video`가 없는 영역은 51화로 취급합니다.

### 성우
- 일본어판 연결: `sameVoice(c)` — 같은 `voice` 문자열을 가진 다른 작품 캐릭터
- 한국어판 표시: `koVoice(c, video)` — 지금 화의 크레딧, 없으면 크레딧이 있는 다른 화. 치이카와 캐릭터만 해당
- 한국어판 성우 출연작: `koActors` (`[작품명, 배역]` 목록). 미소와 김다빈은 같은 사람이라 같은 목록을 공유

### 영역 (`data/regions.json`)
```json
{ "characterId": "chiikawa", "video": "slyms27PQJQ", "startTime": 8.5, "endTime": 9.5,
  "boundingBox": { "x": 0.45, "y": 0.31, "width": 0.23, "height": 0.43 },
  "keyframes": [{ "time": 9, "boundingBox": { "x": 0.45, "y": 0.31, "width": 0.22, "height": 0.4 } }] }
```
좌표는 영상 크기 기준 0~1, 시간은 초. `keyframes`는 선택 항목입니다. 형식 검증은 `validRegions`가 합니다.

## 지켜야 할 설계 의도

이 프로젝트는 과제 평가 기준("TV와 리모컨은 같은 정보를 반복하지 않는다", "시청 경험의 변화가 드러나야 한다")에 맞춰 설계되었습니다. 아래 동작은 바꾸지 마세요. 바꿔야 한다면 사용자에게 먼저 확인하세요.

1. **영상은 선택 때문에 멈추지 않습니다.** 장면 편집기에서 영역을 그릴 때만 예외입니다.
2. **TV와 휴대폰의 역할을 나눕니다.** 휴대폰으로 선택하면 TV에는 `tvChip`(이름·목소리 작은 카드)만, 상세 탐색과 검색은 휴대폰에만 나옵니다. 휴대폰 없이 PC 마우스로 선택하면 TV 유리 패널에서 탐색합니다.
3. **빈 곳을 누르면 검색 창을 띄우지 않습니다.** 패널이 열려 있으면 패널만 닫고, 아니면 "앗, 캐릭터가 선택되지 않았어요…" 안내를 띄웁니다.
4. **다음 화는 같은 작품 안에서만 이어집니다.** 작품의 마지막 영상이 끝나면 그 작품 상세를 엽니다. 카운트다운은 5초이고 재생 중일 때만 흐릅니다.
5. **치이카와는 한국어 더빙 기준으로 표시합니다.** 한국어판 성우를 먼저, 일본어판 성우를 함께 보여 주고, 앱 안의 다른 작품 연결은 일본어판 성우 기준입니다.
6. **정보는 확인된 것만 넣습니다.** 캐릭터 이름·성우·배역을 추측해서 만들지 마세요. 출처가 없으면 넣지 말고, 넣으면 README의 출처나 `ATTRIBUTION.md`에 남기세요.

## 자주 하는 작업

- **캐릭터 추가**: `characters`에 항목 추가 → `logic.js`의 `characterIds`에 id 추가 → 이미지를 `public/characters`에 넣고 `ATTRIBUTION.md`에 출처 기록 → 영역 추가 → 테스트.
- **영상 추가**: 치이카와 화는 `episodes`, 다른 작품은 `works`에 추가하고 `credits`(엔딩 시작 초)를 정합니다. 그 영상의 영역에는 `video` 필드를 꼭 넣습니다.
- **영역 추가·수정**: 앱의 장면 편집기에서 그리고 서버 저장(지금 보고 있는 영상에 저장됨)하거나, `data/regions.json`을 직접 고칩니다. 대표 장면은 `logic.test.mjs`에 검사를 하나 추가하세요.
- **한국어판 성우 정보**: 크레딧은 `episodes[].dub`, 출연작은 `koActors`.
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
