import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F, L, s } from "./theme";
import { Fonts } from "./Fonts";
import { Backdrop } from "./components/Backdrop";
import { TelopBar, G, Note } from "./components/Telop";
import { SuspectCounter, NarrowBar, BigStat } from "./components/Counter";
import { ClueCard } from "./components/ClueCard";
import { LogoLanding, BigTitle, SectionLabel } from "./components/Title";
import { PanelFootage, FullFootage } from "./components/Footage";
import { Soundtrack } from "./Soundtrack";

/* ============================================================
 *  90秒の本編。カット割りは DESIGN.md §4 の表と1対1で対応する。
 *  秒数を変えるときは必ず両方直すこと。
 * ============================================================ */

/** 冒頭の「タメ」：中央から広がる光 */
const Flare: React.FC<{ peakAt?: number }> = ({ peakAt = 22 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, peakAt, peakAt + 30], [0, 1, 0.35], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle ${420 * p + 60}px at 50% 46%, ${C.goldLight}cc 0%, ${C.gold}44 35%, transparent 70%)`,
        opacity: p,
      }}
    />
  );
};

/** 素材の切り替わりを目立たせないための短いディゾルブ */
const FadeIn: React.FC<{ frames?: number; children: React.ReactNode }> = ({
  frames = 8,
  children,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, frames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** 捜査コア（#4〜#8）の共通レイアウト：左に現場、右に捜査ボード */
const Investigation: React.FC<{
  footage: { src: string; startAtSec: number; rate?: number };
  from: number;
  to: number;
  countStartAt?: number;
  clues: React.ReactNode;
  telop: React.ReactNode;
  step?: string;
  note?: string;
}> = ({ footage, from, to, countStartAt = 10, clues, telop, step, note }) => (
  <>
    <SectionLabel no="FILE No.002" title="捜査 ―― ひみつの数をさがせ" />
    <div style={{ position: "absolute", left: L.stage.left, top: L.stage.top }}>
      <PanelFootage {...footage} width={L.stage.width} />
    </div>
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
      <SuspectCounter from={from} to={to} startAt={countStartAt} />
      <NarrowBar total={50} from={from} to={to} startAt={countStartAt} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 8 }}>
        {clues}
      </div>
      {note ? <Note inline>{note}</Note> : null}
    </div>
    <TelopBar step={step} text={telop} />
  </>
);

/** 証拠3枚。まだ出ていないものは dim で伏せておく（0 = まだ1枚も調べていない） */
const Clues: React.FC<{ upto: 0 | 1 | 2 | 3 }> = ({ upto }) => (
  <>
    <ClueCard cat="parity" index={1} text={<>犯人の数は 偶数（ぐうすう）</>} dim={upto < 1} />
    <ClueCard cat="multiple" index={2} text={<>犯人の数は【6】の倍数</>} dim={upto < 2} />
    <ClueCard cat="basic" index={3} text={<>一の位は【4】</>} dim={upto < 3} />
  </>
);

const FEATURES: [string, string][] = [
  ["🕵️", "捜査"],
  ["📔", "手がかり図鑑"],
  ["🔬", "重ねて分析"],
  ["✒️", "挑戦状づくり"],
  ["🏁", "グループ対決"],
  ["📖", "用語じてん"],
];

export const Main: React.FC = () => (
  <Fonts>
    <Backdrop>
      <Soundtrack />

      {/* #1 つかみ：単元の提示 */}
      <Sequence durationInFrames={s(7)}>
        <Flare />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 58,
              letterSpacing: 14,
              color: C.manila,
            }}
          >
            小 5 算 数 ・ 整 数 の 性 質
          </div>
        </AbsoluteFill>
        <TelopBar text={<>小5算数「整数の性質」。<G>つまずきやすい</G>単元です。</>} />
      </Sequence>

      {/* #2 子どものつぶやきを巨大明朝で */}
      <Sequence from={s(7)} durationInFrames={s(4)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <BigTitle sub="——その授業、「事件」にしてみませんか。">
            「倍数って、
            <br />
            なんだっけ？」
          </BigTitle>
        </AbsoluteFill>
        <TelopBar text={<>——その授業、<G>「事件」</G>にしてみませんか。</>} />
      </Sequence>

      {/* #3 ロゴ着地 */}
      <Sequence from={s(11)} durationInFrames={s(3.5)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <LogoLanding subtitle="小5・整数の性質／Google Apps Script でうごく学習アプリ" />
        </AbsoluteFill>
        <TelopBar text={<>数の世界の<G>事件簿</G>へ、ようこそ。</>} />
      </Sequence>

      {/* #4 現場が置かれる */}
      <Sequence from={s(14.5)} durationInFrames={s(5.5)}>
        <FadeIn>
          <Investigation
            footage={{ src: "footage/s04.mp4", startAtSec: 0.0 }}
            from={0}
            to={50}
            countStartAt={6}
            clues={<Clues upto={0} />}
            step="①"
            telop={<>ルールは1つ。かくれた<G>「ひみつの数」</G>を当てる。</>}
          />
        </FadeIn>
      </Sequence>

      {/* #5 手がかりを調べる → 証拠① */}
      <Sequence from={s(20)} durationInFrames={s(5.5)}>
        <Investigation
          footage={{ src: "footage/s05.mp4", startAtSec: 0.4 }}
          from={50}
          to={50}
          clues={<Clues upto={1} />}
          step="②"
          telop={<>手がかりを1枚ずつ調べて、<G>犯人を追いつめる</G>。</>}
        />
      </Sequence>

      {/* #6 合う数を自分でタップ 50 → 25 */}
      <Sequence from={s(25.5)} durationInFrames={s(10.5)}>
        <Investigation
          footage={{ src: "footage/s06.mp4", startAtSec: 3.0, rate: 1.05 }}
          from={50}
          to={25}
          countStartAt={s(2)}
          clues={<Clues upto={1} />}
          step="③"
          telop={<>合う数は<G>自分でぜんぶタップ</G>。ここが考えどころ。</>}
          note="自動では消えません。えらび終わるまで次に進めません"
        />
      </Sequence>

      {/* #7 証拠② → 25 → 8 */}
      <Sequence from={s(36)} durationInFrames={s(5.5)}>
        <Investigation
          footage={{ src: "footage/s07.mp4", startAtSec: 9.0, rate: 1.15 }}
          from={25}
          to={8}
          countStartAt={s(2.5)}
          clues={<Clues upto={2} />}
          telop={<>手がかりを重ねるほど、<G>容ぎ者は減っていく</G>。</>}
        />
      </Sequence>

      {/* #8 証拠③ → 8 → 1 */}
      <Sequence from={s(41.5)} durationInFrames={s(4)}>
        <Investigation
          footage={{ src: "footage/s08.mp4", startAtSec: 11.0, rate: 1.2 }}
          from={8}
          to={1}
          countStartAt={s(2.5)}
          clues={<Clues upto={3} />}
          telop={<>そして、のこったのは——</>}
        />
      </Sequence>

      {/* #9 解決
          アプリの解決モーダル自体が「解決」スタンプを持っているので、
          Remotion 側でスタンプを重ねない（同じ判子が2つ出てしまう）。 */}
      <Sequence from={s(45.5)} durationInFrames={s(8)}>
        <FadeIn>
          <AbsoluteFill>
            <FullFootage src="footage/s09.mp4" startAtSec={19.2} />
          </AbsoluteFill>
        </FadeIn>
        <div style={{ position: "absolute", left: 84, top: 74 }}>
          <SuspectCounter from={1} to={1} />
        </div>
        <TelopBar text={<><G>真犯人は 24</G>。使った手がかりは、たった3つ。</>} />
      </Sequence>

      {/* #10 かならず解ける根拠 */}
      <Sequence from={s(53.5)} durationInFrames={s(5)}>
        <SectionLabel no="FILE No.004" title="なぜ、かならず解けるのか" />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <BigStat
            label="容ぎ者が1人に絞れる確率"
            value={100}
            caption="全フェーズ 3000回 × 検証ずみ ―― 最後は運、にならない"
          />
        </AbsoluteFill>
        <TelopBar text={<>手がかりを重ねれば<G>論理だけ</G>でたどりつけます。</>} />
        <Note>問題は「基本の手がかりで必ず一意に絞れる」ことを保証して生成しています</Note>
      </Sequence>

      {/* #11 解禁マップ
          素材が全面に情報を持っているので章ラベルは置かない（見出しが二重になる）。
          テロップに最下段がかからないよう、少しだけ縮めて上に寄せる。 */}
      <Sequence from={s(58.5)} durationInFrames={s(5.5)}>
        <FadeIn>
          <AbsoluteFill style={{ transform: "translateY(-52px) scale(0.90)" }}>
            <FullFootage src="footage/s11.mp4" startAtSec={26.5} />
          </AbsoluteFill>
        </FadeIn>
        <TelopBar text={<>解決するほど<G>探偵レベル</G>が上がり、使える手がかりが増える。</>} />
      </Sequence>

      {/* #12 重ねて分析 */}
      <Sequence from={s(64)} durationInFrames={s(5.5)}>
        <FadeIn>
          <AbsoluteFill>
            {/* #hlQuestion に寄った区間はグリッド上部が切れるので、
                パネル全体が入っている手前の区間を使う */}
            <FullFootage src="footage/s12.mp4" startAtSec={5.4} />
          </AbsoluteFill>
        </FadeIn>
        <TelopBar text={<><G>公倍数・公約数</G>は、重ねて目で見て確かめる。</>} />
      </Sequence>

      {/* #13 挑戦状づくり */}
      <Sequence from={s(69.5)} durationInFrames={s(5)}>
        <FadeIn>
          <AbsoluteFill>
            <FullFootage src="footage/s13.mp4" startAtSec={6.5} />
          </AbsoluteFill>
        </FadeIn>
        <TelopBar text={<>自分で<G>挑戦状</G>をつくって、なかまに解かせる。</>} />
        <Note>手がかりを足すたび、のこりの容ぎ者数がその場でわかります</Note>
      </Sequence>

      {/* #14 グループ対決 */}
      <Sequence from={s(74.5)} durationInFrames={s(4)}>
        <FadeIn>
          <AbsoluteFill>
            <FullFootage src="footage/s14.mp4" startAtSec={3.4} />
          </AbsoluteFill>
        </FadeIn>
        <TelopBar text={<>クラスみんなでの<G>対戦</G>にも。</>} />
      </Sequence>

      {/* #15 6つの機能 */}
      <Sequence from={s(78.5)} durationInFrames={s(4.5)}>
        <SectionLabel no="FILE No.006" title="6つの機能" />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 34,
            }}
          >
            {FEATURES.map(([icon, name], i) => {
              const cat = Object.values(C.cat)[i % 6];
              return (
                <div
                  key={name}
                  style={{
                    width: 460,
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    padding: "26px 32px",
                    background: "rgba(20,15,9,.72)",
                    borderRadius: 5,
                    borderLeft: `12px solid ${cat}`,
                  }}
                >
                  <span style={{ fontSize: 54 }}>{icon}</span>
                  <span style={{ fontFamily: F.display, fontSize: 46, color: C.paper }}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
        <TelopBar text={<>導入からまとめまで、<G>これ1つで</G>。</>} />
      </Sequence>

      {/* #16 締め */}
      <Sequence from={s(83)} durationInFrames={s(7)}>
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
      </Sequence>
    </Backdrop>
  </Fonts>
);
