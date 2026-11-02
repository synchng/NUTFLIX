import { VIDEOS } from "./logic.js";
export const official = "https://www.anime-chiikawa.jp/";
export type TitleId = "sunshine" | "chiikawa";
/** What a pointed thing is; the info panel and phone sheet word themselves by kind. */
export type Kind = "character" | "person" | "prop" | "place";
export const kindLabel: Record<Kind, string> = { character: "캐릭터", person: "인물", prop: "소품", place: "장소" };
type Link = { label: string; url: string };
export type Track = { part: number; title: string; artist: string; date: string };
export type Location = { name: string; area: string; note: string; source: Link; mapQuery: string };
export type Title = {
  id: TitleId;
  video: string;
  name: string;
  /** Netflix-style genre line under the title. */
  genre: string;
  tagline: string;
  summary: string;
  hero: string;
  label: string;
  length: string;
  /** Rough length for the progress bar before the player reports it. */
  duration: number;
  /** Second the ending starts; the up-next card appears from here. */
  credits: number;
  source: string;
  meta: string[];
  cast: string;
  explore: string;
  ost?: Track[];
  locations?: Location[];
  otherLocations?: string[];
};
const wiki = { label: "위키백과 「미스터 션샤인」", url: "https://ko.wikipedia.org/wiki/%EB%AF%B8%EC%8A%A4%ED%84%B0_%EC%85%98%EC%83%A4%EC%9D%B8" };
export const titles: Record<TitleId, Title> = {
  sunshine: {
    id: "sunshine",
    video: VIDEOS.sunshine,
    name: "미스터 션샤인",
    genre: "시대극 · 로맨스 · 한국 드라마",
    tagline: "개화기 조선, 한성을 무대로 한 이야기.",
    summary:
      "노비의 아들로 태어나 미 해병대 장교가 되어 조선으로 돌아온 유진 초이, 의병 저격수로 활동하는 사대부 영애 고애신, 그리고 격변하는 한성의 사람들.",
    hero: "/sunshine/hero.jpg",
    label: "공식 하이라이트 Full Ver.",
    length: "약 14분",
    duration: 841,
    credits: 834,
    source: "tvN DRAMA 공식 채널 · 첫 방송 전 공개된 하이라이트",
    meta: ["2018", "tvN", "24부작", "극본 김은숙", "연출 이응복"],
    cast: "이병헌, 김태리, 유연석, 김민정, 변요한",
    explore: "인물 · 소품 · 촬영지 · OST",
    // Parts, titles, artists and dates as listed on Wikipedia's soundtrack table.
    ost: [
      { part: 1, title: "그 날", artist: "박효신", date: "2018.07.08" },
      { part: 2, title: "슬픈 행진", artist: "일레인", date: "2018.07.15" },
      { part: 3, title: "눈물 아닌 날들", artist: "김윤아", date: "2018.07.22" },
      { part: 4, title: "소리", artist: "이수현", date: "2018.07.29" },
      { part: 5, title: "좋은 날", artist: "멜로망스", date: "2018.08.05" },
      { part: 6, title: "My Home (Eugene's song)", artist: "사비나 앤 드론즈", date: "2018.08.06" },
      { part: 7, title: "바람이 되어", artist: "하현상", date: "2018.08.12" },
      { part: 8, title: "이방인", artist: "박원", date: "2018.08.13" },
      { part: 9, title: "Shine Your Star", artist: "오존", date: "2018.08.19" },
      { part: 10, title: "And I", artist: "뉴이스트 W", date: "2018.08.26" },
      { part: 11, title: "See You Again (feat. 리처드 용재 오닐)", artist: "백지영", date: "2018.09.02" },
      { part: 12, title: "불꽃처럼 아름답게", artist: "신승훈", date: "2018.09.09" },
      { part: 13, title: "정인", artist: "김세정", date: "2018.09.16" },
      { part: 14, title: "If You Were Me", artist: "벤", date: "2018.09.23" },
      { part: 15, title: "어찌 잊으오", artist: "황치열", date: "2018.09.30" },
    ],
    locations: [
      {
        name: "선샤인스튜디오 (논산 선샤인랜드)",
        area: "충남 논산시 연무읍",
        mapQuery: "논산 선샤인랜드",
        note: "1900년대 초반 한성을 재현한 약 2만㎡의 세트장. 드라마 대부분을 이곳에서 촬영했어요.",
        source: { label: "경북매일 2023.02.23", url: "https://kbmaeil.com/article/202302230355791" },
      },
      {
        name: "만휴정",
        area: "경북 안동",
        mapQuery: "안동 만휴정",
        note: "조선 문신 김계행이 말년에 지은 정자. 유진 초이와 고애신이 촬영한 장소로 알려져 있어요.",
        source: { label: "경북매일 2025.03.26", url: "https://kbmaeil.com/article/202503260913511" },
      },
    ],
    otherLocations: ["최참판댁", "배동 삼릉숲", "부안영상테마파크", "황매산", "초간정", "일두고택", "화왕산성", "운보의 집", "해미읍성", "서도역 영상촬영장", "계명대학교(계명한학촌)", "고창읍성", "대장금파크", "천은사", "탑동 양관"],
  },
  chiikawa: {
    id: "chiikawa",
    video: VIDEOS.chiikawa,
    name: "치이카와",
    genre: "애니메이션 · 일본",
    tagline: "작은 친구들의, 조금은 특별한 하루.",
    summary: "나가노의 만화에서 시작된 작고 귀여운 친구들의 이야기. 토벌 랭커를 꿈꾸는 치이카와와 하치와레, 그리고 랏코.",
    hero: "/catalog/chiikawa.jpg",
    label: "51~55화 · 「토벌 랭커」 편",
    length: "약 5분 30초",
    duration: 330,
    credits: 305,
    source: "めざましテレビ 공식 채널 · 11/6(금) 오전 7:59까지 1주간 한정 공개",
    meta: ["애니메이션", "5개 에피소드"],
    cast: "치이카와, 하치와레, 우사기, 랏코, 후구(복어)",
    explore: "캐릭터 · 성우 · 공식 프로필 출연작",
  },
};
export const titleList = [titles.sunshine, titles.chiikawa];
export const sunshineWiki = wiki;
export type Character = {
  id: string;
  title: TitleId;
  kind: Kind;
  /** Person this prop or place belongs to in the shot, when the shot itself names them. */
  related?: string;
  facts?: [string, string][];
  source?: Link;
  /** Official profile photo; characters without one link to the source page instead. */
  voiceImage?: string;
  voiceSource: string;
  image: string;
  name: string;
  jp: string;
  voice: string;
  voiceJp: string;
  mark: string;
  color: string;
  description: string;
};
export const characters: Character[] = [
  {
    id: "chiikawa",
    title: "chiikawa",
    kind: "character",
    voiceImage: "/actors/haruka-aoki.jpg",
    voiceSource: "https://www.production-ace.co.jp/ace_talent/haruka-aoki/",
    image: "/characters/chiikawa.png",
    name: "치이카와",
    jp: "ちいかわ",
    voice: "아오키 하루카",
    voiceJp: "青木遥",
    mark: "ち",
    color: "#f1d2d8",
    description:
      "나가노의 만화에서 시작된 「치이카와」의 주인공. 친구들과 함께하는 작고 귀여운 일상을 만나보세요.",
  },
  {
    id: "hachiware",
    title: "chiikawa",
    kind: "character",
    voiceImage: "/actors/makoto-tanaka.jpg",
    voiceSource: "https://profile.himawari.net/view/2234",
    image: "/characters/hachiware.png",
    name: "하치와레",
    jp: "ハチワレ",
    voice: "타나카 마코토",
    voiceJp: "田中誠人",
    mark: "ハ",
    color: "#bcdce7",
    description:
      "치이카와의 친구. 「치이카와」의 엔딩곡 ‘ひとりごつ’를 담당한 캐릭터입니다.",
  },
  {
    id: "usagi",
    title: "chiikawa",
    kind: "character",
    voiceImage: "/actors/ari-ozawa.jpg",
    voiceSource: "https://www.imenterprise.jp/profile.php?id=31",
    image: "/characters/usagi.png",
    name: "우사기",
    jp: "うさぎ",
    voice: "오자와 아리",
    voiceJp: "小澤亜李",
    mark: "う",
    color: "#efe1a9",
    description:
      "치이카와, 하치와레와 함께하는 친구. 이번 영상 마지막 이야기에서 무기를 고르러 와요.",
  },
  {
    id: "rakko",
    title: "chiikawa",
    kind: "character",
    voiceImage: "/actors/yuma-uchida.jpg",
    voiceSource: "https://intention-k.com/profile/yuma_uchida",
    image: "/characters/rakko.png",
    name: "랏코",
    jp: "ラッコ",
    voice: "우치다 유마",
    voiceJp: "内田雄馬",
    mark: "ラ",
    color: "#dcc996",
    description:
      "검과 망토를 두른 토벌 실력자. 이번 영상에서 위기에 빠진 치이카와를 구해 줘요.",
  },
  {
    id: "fugu",
    title: "chiikawa",
    kind: "character",
    voiceSource: "https://www.youtube.com/watch?v=h0vBWdZf2l0",
    image: "/characters/fugu.jpg",
    name: "후구(복어)",
    jp: "フグ",
    voice: "타지마 아키히로",
    voiceJp: "田島章寛",
    mark: "フ",
    color: "#cfe6ef",
    description: "이번 영상 후반에 등장하는 복어 캐릭터예요.",
  },
  // 미스터 션샤인. People are marked only in the opening shots that show the actor's name on screen;
  // props and places come from what is visible in the frame, described without naming who holds them.
  {
    id: "eugene",
    title: "sunshine",
    kind: "person",
    voiceSource: "https://ko.wikipedia.org/w/index.php?search=%EC%9D%B4%EB%B3%91%ED%97%8C%20%EB%B0%B0%EC%9A%B0",
    image: "/sunshine/eugene.jpg",
    name: "유진 초이",
    jp: "최유진 · Eugene Choi",
    voice: "이병헌",
    voiceJp: "이병헌",
    mark: "유",
    color: "#c9d3e6",
    description: "노비의 아들로 태어나 미 해병대 대위가 되어 조선으로 돌아온 인물이에요.",
    source: sunshineWiki,
  },
  {
    id: "aeshin",
    title: "sunshine",
    kind: "person",
    voiceSource: "https://ko.wikipedia.org/w/index.php?search=%EA%B9%80%ED%83%9C%EB%A6%AC%20%EB%B0%B0%EC%9A%B0",
    image: "/sunshine/aeshin.jpg",
    name: "고애신",
    jp: "高愛信",
    voice: "김태리",
    voiceJp: "김태리",
    mark: "고",
    color: "#ead7dc",
    description: "사대부 집안의 영애이자, 의병 저격수로 활동하는 인물이에요.",
    source: sunshineWiki,
  },
  {
    id: "dongmae",
    title: "sunshine",
    kind: "person",
    voiceSource: "https://ko.wikipedia.org/w/index.php?search=%EC%9C%A0%EC%97%B0%EC%84%9D%20%EB%B0%B0%EC%9A%B0",
    image: "/sunshine/dongmae.jpg",
    name: "구동매",
    jp: "이시다 쇼",
    voice: "유연석",
    voiceJp: "유연석",
    mark: "구",
    color: "#d9cbc4",
    description: "백정의 아들로 태어나 무신회 한성지부장이 된 인물이에요.",
    source: sunshineWiki,
  },
  {
    id: "hina",
    title: "sunshine",
    kind: "person",
    voiceSource: "https://ko.wikipedia.org/w/index.php?search=%EA%B9%80%EB%AF%BC%EC%A0%95%20%EB%B0%B0%EC%9A%B0",
    image: "/sunshine/hina.jpg",
    name: "쿠도 히나",
    jp: "이양화",
    voice: "김민정",
    voiceJp: "김민정",
    mark: "쿠",
    color: "#e3d2e8",
    description: "호텔 글로리의 사장. 본명은 이양화로, 이완익의 딸이에요.",
    source: sunshineWiki,
  },
  {
    id: "heeseong",
    title: "sunshine",
    kind: "person",
    voiceSource: "https://ko.wikipedia.org/w/index.php?search=%EB%B3%80%EC%9A%94%ED%95%9C%20%EB%B0%B0%EC%9A%B0",
    image: "/sunshine/heeseong.jpg",
    name: "김희성",
    jp: "金喜成",
    voice: "변요한",
    voiceJp: "변요한",
    mark: "김",
    color: "#d8e0cf",
    description: "고애신의 정혼자. 정혼을 피해 일본에서 지내던 사대부 집안 자제예요.",
    source: sunshineWiki,
  },
  {
    id: "cap",
    title: "sunshine",
    kind: "prop",
    voiceSource: sunshineWiki.url,
    image: "/sunshine/cap.jpg",
    name: "장교 군모",
    jp: "이병헌 소개 장면",
    voice: "",
    voiceJp: "",
    mark: "장",
    color: "#c7cfdc",
    description: "유진 초이를 소개하는 장면의 챙 달린 군모. 극 중 유진 초이는 미 해병대 대위예요.",
    related: "eugene",
    facts: [["등장", "0분 14초 · 이병헌 소개 장면"], ["극 중 신분", "미 해병대 대위 (위키백과)"]],
    source: sunshineWiki,
  },
  {
    id: "tophat",
    title: "sunshine",
    kind: "prop",
    voiceSource: sunshineWiki.url,
    image: "/sunshine/tophat.jpg",
    name: "실크해트",
    jp: "변요한 소개 장면",
    voice: "",
    voiceJp: "",
    mark: "실",
    color: "#d6d3c8",
    description: "김희성을 소개하는 장면에서 쓴 높은 서양식 모자예요.",
    related: "heeseong",
    facts: [["등장", "0분 29초 · 변요한 소개 장면"]],
  },
  {
    id: "rifle",
    title: "sunshine",
    kind: "prop",
    voiceSource: sunshineWiki.url,
    image: "/sunshine/rifle.jpg",
    name: "장총",
    jp: "저격 장면",
    voice: "",
    voiceJp: "",
    mark: "장",
    color: "#c9d1c6",
    description: "어둠 속에서 겨누는 장총. 극 중 고애신은 의병 저격수로, 장승구에게 사격을 배워요.",
    facts: [["등장", "2분 53초 · 5분 42초"], ["관련 인물", "고애신 (의병 저격수) · 장승구 (사격 스승)"]],
    source: sunshineWiki,
  },
  {
    id: "pistol",
    title: "sunshine",
    kind: "prop",
    voiceSource: sunshineWiki.url,
    image: "/sunshine/pistol.jpg",
    name: "권총",
    jp: "겨누는 장면",
    voice: "",
    voiceJp: "",
    mark: "권",
    color: "#cfc7c2",
    description: "인물이 상대를 향해 겨누는 권총이에요.",
    facts: [["등장", "0분 40초 · 10분 0초 · 10분 3초"]],
  },
  {
    id: "bouquet",
    title: "sunshine",
    kind: "prop",
    voiceSource: sunshineWiki.url,
    image: "/sunshine/bouquet.jpg",
    name: "꽃다발",
    jp: "꽃을 건네는 장면",
    voice: "",
    voiceJp: "",
    mark: "꽃",
    color: "#e6e2cc",
    description: "양복 차림의 인물이 한복 차림의 인물에게 건네는 흰 꽃다발이에요.",
    facts: [["등장", "9분 29초"]],
  },
  {
    id: "watch",
    title: "sunshine",
    kind: "prop",
    voiceSource: sunshineWiki.url,
    image: "/sunshine/watch.jpg",
    name: "회중시계",
    jp: "시계 장면",
    voice: "",
    voiceJp: "",
    mark: "회",
    color: "#d6d2c4",
    description: "손바닥 위에 놓인 회중시계. 이어지는 장면에서 시곗바늘이 크게 비춰져요.",
    facts: [["등장", "10분 27초"]],
  },
  {
    id: "glory",
    title: "sunshine",
    kind: "place",
    voiceSource: sunshineWiki.url,
    image: "/sunshine/glory.jpg",
    name: "호텔 글로리",
    jp: "Glory Hotel",
    voice: "",
    voiceJp: "",
    mark: "호",
    color: "#c6d5d4",
    description: "극 중 쿠도 히나가 운영하는 호텔이에요. 간판과 \"Welcome to Korean Empire\" 현판이 보여요.",
    related: "hina",
    facts: [["등장", "6분 28초"], ["촬영", "드라마 대부분은 충남 논산 선샤인스튜디오 세트에서 촬영했어요"]],
    source: { label: "경북매일 2023.02.23 (촬영 세트)", url: "https://kbmaeil.com/article/202302230355791" },
  },
];
/**
 * Japanese voice actors keyed by `voiceJp`. `works` are the anime credits listed on the
 * actor's official agency profile ([title, role] as written there, Chiikawa itself left out).
 */
export const actors: Record<string, { agency: string; profile?: string; works: [string, string][] }> = {
  青木遥: {
    agency: "프로덕션 에이스",
    profile: "https://www.production-ace.co.jp/ace_talent/haruka-aoki/",
    works: [
      ["映画ちいかわ 人魚の島のひみつ", "ちいかわ"],
      ["天久鷹央の推理カルテ", "鈴原宗一郎"],
    ],
  },
  田中誠人: {
    agency: "극단 히마와리",
    profile: "https://profile.himawari.net/view/2234",
    works: [],
  },
  小澤亜李: {
    agency: "아임 엔터프라이즈",
    profile: "https://www.imenterprise.jp/profile.php?id=31",
    works: [
      ["BASTARD!!―暗黒の破壊神―", "シーン・ハリ"],
      ["月刊少女野崎くん", "佐倉千代"],
      ["ＩＤ-０", "ファルザ"],
      ["アクエリオンロゴス", "海凪花嵐"],
      ["アクティヴレイド-機動強襲室第八係-", "花咲里あさみ"],
      ["えとたま", "ウマたん"],
      ["えんどろ～！", "ファイ"],
      ["転生悪女の黒歴史", "メノア・カミーリア"],
      ["おしえて魔法のペンデュラム～リルリルフェアリル～", "スピカ"],
      ["俺物語!!", "コジマ"],
      ["学戦都市アスタリスク", "刀藤綺凛"],
      ["かくしごと", "古武シルビア"],
      ["かぐや様は告らせたい～天才たちの恋愛頭脳戦～", "藤原萌葉"],
      ["青のオーケストラ Season2", "平良まりあ"],
      ["がっこうぐらし！", "恵飛須沢胡桃"],
      ["Caligula -カリギュラ-", "守田鳴子"],
      ["鬼滅の刃", "白髪"],
      ["キングスレイド 意志を継ぐものたち", "クレオ"],
      ["Classroom☆Crisis", "瀬良ミズキ"],
      ["クレヨンしんちゃん", "日村さな"],
      ["警視庁 特務部 特殊凶悪犯対策室 第七課 -トクナナ-", "ベルメール・サンク"],
      ["恋は雨上がりのように", "ゆう"],
      ["この世界の果てで恋を唄う少女ＹＵ－ＮＯ", "ユーノ"],
      ["この美術部には問題がある！", "宇佐美みずき"],
      ["小森さんは断れない！", "西鳥めぐみ"],
      ["最弱無敗の神装機竜", "アイリ・アーカディア"],
      ["ジュエルペット マジカルチェンジ", "雲母あいり"],
      ["ステラのまほう", "関あやめ"],
      ["多田くんは恋をしない", "ニャンコビッグ"],
    ],
  },
  内田雄馬: {
    agency: "인텐션",
    profile: "https://intention-k.com/profile/yuma_uchida",
    works: [
      ["二十世紀電氣目録-ユーレカ・エヴリカ-", "坂本喜八"],
      ["時光代理人", "Vein"],
      ["超かぐや姫！", "駒沢雷"],
      ["デブとラブと過ちと!", "結城圭介"],
      ["ワンダンス", "壁谷楽"],
      ["カラオケ行こ!", "ジャージ"],
      ["遠井さんは青春したい！「バカとスマホとロマンスと」", "山田サタン"],
      ["強くてニューサーガ", "カイル"],
      ["メダリスト", "夜鷹純"],
      ["クラシック★スターズ", "ベートーヴェン"],
      ["＃コンパス2.0 戦闘摂理解析システム", "塵"],
      ["LAZARUS ラザロ", "リーランド"],
      ["アオのハコ", "針生健吾"],
      ["先輩はおとこのこ", "大我竜二"],
      ["神之塔 -Tower of God-", "王野成"],
      ["WIND BREAKER", "桜遥"],
      ["シャングリラ・フロンティア", "サンラク／陽務楽"],
      ["愚かな天使は悪魔と踊る", "阿久津雅虎"],
      ["悪役令嬢レベル99 〜私は裏ボスですが魔王ではありません〜", "パトリック・アッシュバトン"],
      ["グレンダイザーU", "カサド・ゼオラ・ホワイター"],
      ["MFゴースト", "片桐夏向"],
      ["るろうに剣心 -明治剣客浪漫譚-", "四乃森蒼紫"],
      ["THE MARGINAL SERVICE", "ラバー・スーツ"],
      ["デッドマウント・デスプレイ", "操屋匠"],
      ["Opus.COLORs", "月見里和哉"],
      ["とんでもスキルで異世界放浪メシ", "ムコーダ（向田剛志）"],
      ["ブルーロック", "御影玲王"],
      ["虫かぶり姫", "グレン・アイゼナッハ"],
      ["悪役令嬢なのでラスボスを飼ってみました", "アイザック・ロンバール"],
      ["東京ミュウミュウ にゅ~♡", "青山雅也"],
    ],
  },
  // No official agency profile could be found; only the role credited in this video is shown.
  田島章寛: { agency: "소속 미확인", works: [] },
  이병헌: { agency: "배우", profile: "https://ko.wikipedia.org/w/index.php?search=%EC%9D%B4%EB%B3%91%ED%97%8C%20%EB%B0%B0%EC%9A%B0", works: [] },
  김태리: { agency: "배우", profile: "https://ko.wikipedia.org/w/index.php?search=%EA%B9%80%ED%83%9C%EB%A6%AC%20%EB%B0%B0%EC%9A%B0", works: [] },
  유연석: { agency: "배우", profile: "https://ko.wikipedia.org/w/index.php?search=%EC%9C%A0%EC%97%B0%EC%84%9D%20%EB%B0%B0%EC%9A%B0", works: [] },
  김민정: { agency: "배우", profile: "https://ko.wikipedia.org/w/index.php?search=%EA%B9%80%EB%AF%BC%EC%A0%95%20%EB%B0%B0%EC%9A%B0", works: [] },
  변요한: { agency: "배우", profile: "https://ko.wikipedia.org/w/index.php?search=%EB%B3%80%EC%9A%94%ED%95%9C%20%EB%B0%B0%EC%9A%B0", works: [] },
};
/** One short line under an item's name: who voices or plays it, or what kind of thing it is. */
export function itemSub(c: Character) {
  if (c.kind === "character") return `성우 ${c.voice}`;
  if (c.kind === "person") return `배우 ${c.voice}`;
  return `${kindLabel[c.kind]} · ${titles[c.title].name}`;
}
export const itemsOf = (id: TitleId) => characters.filter((c) => c.title === id);
