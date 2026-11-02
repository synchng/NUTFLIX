import { VIDEO } from "./logic.js";
export { VIDEO };
export const official = "https://www.anime-chiikawa.jp/";
/** The one video this prototype plays: an official limited-time upload of episodes 51–55. */
export const episode = {
  video: VIDEO,
  title: "치이카와",
  label: "51~55화 · 「토벌 랭커」 편",
  length: "약 5분 30초",
  /** Second the ending credits start; the up-next card appears from here. */
  credits: 305,
  source: "めざましテレビ 공식 채널 · 11/6(금) 오전 7:59까지 1주간 한정 공개",
};
export type Character = {
  id: string;
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
};
