/* ============================================================
 *  デザインシステム
 *  出典：src/styles.html の :root と、参考動画（黒×金×赤）の分析
 *  ―― 動画とアプリで色・書体を完全に一致させ、地続きに見せる
 * ============================================================ */

export const C = {
  /** 机（動画の地色）。参考動画の「黒」に相当するが、完全な黒より温かい */
  desk: "#2b241c",
  deskDeep: "#1a150f",
  deskMid: "#1e1913",

  /** 書類（セピアの古紙）＝パネル・文字の主色 */
  paper: "#f2e4c6",
  paper2: "#e9d7b0",
  paperEdge: "#d8c191",

  /** インク */
  ink: "#3a2f22",
  inkSoft: "#6f5f47",

  /** アクセント */
  gold: "#c79a3f",
  goldLight: "#ffd36a",
  goldDeep: "#a87f28",
  stamp: "#b03a2e",
  stampDeep: "#922f25",
  manila: "#cda76a",
  tab: "#d7b878",

  /** 学習カテゴリ（アプリの手がかりカードと同一） */
  cat: {
    parity: "#2f6f8f",   // 偶数・奇数：青
    multiple: "#5f7a34", // 倍数：緑
    divisor: "#b0402f",  // 約数：赤
    cmul: "#6d4a86",     // 公倍数：紫
    cdiv: "#c47a24",     // 公約数：オレンジ
    basic: "#7a6a4c",    // 基本の手がかり：セピア
  },
} as const;

export const F = {
  /** 見出し・ロゴ（明朝）。参考動画の「極太明朝タイトル」役 */
  display: '"Zen Antique", serif',
  /** 数字（タイプライター）。カウンタ・％・事件番号は必ずこれ */
  mono: '"Special Elite", monospace',
  /** テロップ・本文 */
  body: '"Yusei Magic", sans-serif',
  /** UI 再現パーツ */
  ui: '"Zen Maru Gothic", sans-serif',
} as const;

/** 16:9 を基準に設計し、9:16 は同じ部品を再配置して作る */
export const V = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 90 * 30, // 90秒 = 2700フレーム
} as const;

/** 秒 → フレーム */
export const s = (sec: number) => Math.round(sec * V.fps);

/**
 * 16:9 の版面。アプリのカラムは 940×1122 の縦長なので全画面には敷けない。
 * 左に「アプリ＝現場」、右に「捜査ボード＝証拠と数字」を置く2ゾーン構成にし、
 * 余った机の面積を情報表示に使い切る。9:16 では上下に積み替える。
 */
export const L = {
  /** 左＝現場（アプリの .case-paper パネル。912×709.5 の横長） */
  stage: { left: 88, top: 186, width: 940 },
  /** 右＝捜査ボード（数字・証拠・注釈） */
  board: { left: 1116, right: 1856, top: 168 },
  telopBottom: 46,
} as const;

/** 古紙テクスチャ（styles.html の .paper-tex 相当） */
export const paperTexture = {
  backgroundColor: C.paper,
  backgroundImage: [
    `radial-gradient(120px 90px at 12% 20%, rgba(150,110,50,.10), transparent 70%)`,
    `radial-gradient(160px 120px at 88% 80%, rgba(120,90,40,.12), transparent 70%)`,
    `repeating-linear-gradient(0deg, rgba(120,95,50,.035) 0 3px, transparent 3px 6px)`,
  ].join(","),
} as const;

/** 捜査デスクの背景（styles.html の body 相当） */
export const deskBackground = {
  backgroundColor: C.deskMid,
  backgroundImage: [
    `radial-gradient(1400px 700px at 15% -5%, #3a3126 0%, transparent 55%)`,
    `radial-gradient(1200px 800px at 100% 10%, #35291c 0%, transparent 60%)`,
    `repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, transparent 2px 5px)`,
    `linear-gradient(160deg, ${C.desk} 0%, ${C.deskDeep} 100%)`,
  ].join(","),
} as const;

/** 全カット共通の粒子ノイズ＋ビネット（フィルム感） */
export const vignette =
  "radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(0,0,0,.55) 100%)";
