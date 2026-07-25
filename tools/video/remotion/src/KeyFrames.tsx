import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, L } from "./theme";
import { Fonts } from "./Fonts";
import { Backdrop } from "./components/Backdrop";
import { TelopBar, G, Note } from "./components/Telop";
import { SuspectCounter, NarrowBar, BigStat } from "./components/Counter";
import { ClueCard } from "./components/ClueCard";
import { LogoLanding, BigTitle, SectionLabel } from "./components/Title";
import { SolvedStamp, Spotlight, Shake } from "./components/Stamp";
import { FileCard, ASPECT, panelToFrame } from "./components/FileCard";

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Fonts>
    <Backdrop>{children}</Backdrop>
  </Fonts>
);

/* ── KF1 つかみ：子どものつぶやきを巨大明朝で ───────────────── */
export const KfHook: React.FC = () => (
  <Stage>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <BigTitle sub="——その授業、「事件」にしてみませんか。">
        「倍数って、
        <br />
        なんだっけ？」
      </BigTitle>
    </AbsoluteFill>
    <TelopBar text={<>小5 算数「整数の性質」。<G>つまずきやすい</G>単元です。</>} />
  </Stage>
);

/* ── KF2 ロゴ着地 ────────────────────────────────────── */
export const KfLogo: React.FC = () => (
  <Stage>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <LogoLanding subtitle="小5・整数の性質／Google Apps Script でうごく学習アプリ" />
    </AbsoluteFill>
    <TelopBar text={<>数の世界の<G>事件簿</G>へ、ようこそ。</>} />
  </Stage>
);

/* ── KF3 捜査コア：机レイアウトの基本形 ──────────────────── */
export const KfInvestigate: React.FC = () => (
  <Stage>
    <SectionLabel no="FILE No.002" title="捜査 ―― ひみつの数をさがせ" />

    {/* 左：現場パネル。アプリの .case-paper だけを切り出した素材を使う */}
    <div style={{ position: "absolute", left: L.stage.left, top: L.stage.top }}>
      <FileCard
        src="plates/scene_clue1.png"
        width={L.stage.width}
        aspect={ASPECT.scene}
        rotate={-1.1}
      />
    </div>

    {/* 右：捜査ボード＝数字と証拠 */}
    <div
      style={{
        position: "absolute",
        left: L.board.left,
        top: L.board.top,
        width: L.board.right - L.board.left,
        display: "flex",
        flexDirection: "column",
        gap: 34,
      }}
    >
      <SuspectCounter from={50} to={25} startAt={6} />
      <NarrowBar total={50} from={50} to={25} startAt={6} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 8 }}>
        <ClueCard cat="parity" index={1} text={<>犯人の数は 奇数（きすう）</>} appearAt={0} />
        <ClueCard cat="multiple" index={2} text={<>犯人の数は【4】の倍数</>} appearAt={0} dim />
        <ClueCard cat="basic" index={3} text={<>一の位は【4】</>} appearAt={0} dim />
      </div>
      <Note inline>自動では消えません。えらび終わるまで次に進めません</Note>
    </div>

    <TelopBar
      step="③"
      text={
        <>
          合う数を<G>自分でぜんぶタップ</G>。ここが考えどころ。
        </>
      }
    />
  </Stage>
);

/* ── KF4 解決：スポットライト＋スタンプ ────────────────── */

/** 解決カットだけは現場に寄る。位置は計算で出し、目分量で置かない */
const SOLVED_CARD = { left: 420, top: 70, width: 1080 };
const CULPRIT = panelToFrame(24, SOLVED_CARD);

export const KfSolved: React.FC = () => (
  <Stage>
    <Shake at={0} amount={14}>
      <AbsoluteFill>
        <div style={{ position: "absolute", left: SOLVED_CARD.left, top: SOLVED_CARD.top }}>
          <FileCard
            src="plates/scene_start.png"
            width={SOLVED_CARD.width}
            aspect={ASPECT.scene}
            rotate={0}
          />
        </div>
        <Spotlight target={CULPRIT} dim={0.8} />
        {/* スタンプは書類の右下角に打つ。グリッドの数字を隠さない位置 */}
        <div
          style={{
            position: "absolute",
            left: 1520,
            top: 852,
            transform: "translate(-50%, -50%)",
          }}
        >
          <SolvedStamp />
        </div>
      </AbsoluteFill>
    </Shake>
    <div style={{ position: "absolute", left: 84, top: 74 }}>
      <SuspectCounter from={1} to={1} />
    </div>
    <TelopBar
      text={
        <>
          <G>真犯人は 24</G>。使った手がかりは、たった3つ。
        </>
      }
    />
  </Stage>
);

/* ── KF5 数字を主役に：教材としての裏付け ────────────────── */
export const KfStat: React.FC = () => (
  <Stage>
    <SectionLabel no="FILE No.004" title="なぜ、かならず解けるのか" />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <BigStat
        label="容ぎ者が1人に絞れる確率"
        value={100}
        caption="全フェーズ 3000回 × 検証ずみ ―― 最後は運、にならない"
      />
    </AbsoluteFill>
    <TelopBar
      text={
        <>
          手がかりを重ねれば<G>論理だけ</G>で犯人にたどりつけます。
        </>
      }
    />
    <Note>問題は「基本の手がかりで必ず一意に絞れる」ことを保証して生成しています</Note>
  </Stage>
);

/* ── KF6 締め ───────────────────────────────────────── */
export const KfOutro: React.FC = () => (
  <Stage>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 46 }}>
      <LogoLanding subtitle="導入〜まとめ、そのまま授業で。" />
      <div style={{ display: "flex", gap: 22 }}>
        {["偶数・奇数", "倍数", "約数", "公倍数", "公約数"].map((t, i) => (
          <span
            key={t}
            style={{
              fontFamily: F.ui,
              fontWeight: 700,
              fontSize: 30,
              color: "#fff",
              background: Object.values(C.cat)[i],
              padding: "10px 24px",
              borderRadius: 4,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </AbsoluteFill>
    <TelopBar text={<>進捗は<G>スプレッドシート</G>に。クラスでも、ひとりでも。</>} />
  </Stage>
);
