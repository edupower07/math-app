import React from "react";
import { Audio, Sequence, staticFile, interpolate } from "remotion";
import { s } from "./theme";

/* ============================================================
 *  音まわり。
 *
 *  BGM はユーザー提供の1曲。末尾の無音を落としたうえで、テンポだけを
 *  緩めて（音程は保つ）90秒ちょうどに合わせてある。曲自身のフェード
 *  アウトがそのまま動画の終わりに着地する（scripts/build-audio.py）。
 *
 *  音量の設計：
 *    BGM        -20 LUFS
 *    ナレーション -16 LUFS（BGMより4LU上）
 *    声が乗る区間は BGM を 38% まで下げる（≒ -8dB）。
 *    結果、声と音楽の差は約12LUになり、声がはっきり抜ける。
 *
 *  台本と各行の内容は tools/video/NARRATION.md。
 * ============================================================ */

export type NarrationClip = {
  /** DESIGN.md §4 のカット番号 */
  cut: number;
  /** 読み始める時刻（秒） */
  atSec: number;
  /** 実測の尺（秒）。ダッキングを声の長さぴったりに効かせるために持つ */
  durSec: number;
};

/**
 * カットの頭から 0.25秒おいて読み始める。
 * テロップのフェードイン（約0.27秒）と重なって、絵と声が同時に立ち上がる。
 */
const LEAD_IN = 0.25;

/** 尺は build-audio 後の実測値。カットの尺には必ず収まっている */
export const NARRATION: NarrationClip[] = [
  { cut: 1, atSec: 0.0, durSec: 6.65 },
  { cut: 2, atSec: 7.0, durSec: 3.24 },
  { cut: 3, atSec: 11.0, durSec: 2.81 },
  { cut: 4, atSec: 14.5, durSec: 5.06 },
  { cut: 5, atSec: 20.0, durSec: 4.82 },
  { cut: 6, atSec: 25.5, durSec: 5.23 },
  { cut: 7, atSec: 36.0, durSec: 3.7 },
  { cut: 8, atSec: 41.5, durSec: 1.8 },
  { cut: 9, atSec: 45.5, durSec: 5.76 },
  { cut: 10, atSec: 53.5, durSec: 3.79 },
  { cut: 11, atSec: 58.5, durSec: 4.82 },
  { cut: 12, atSec: 64.0, durSec: 4.42 },
  { cut: 13, atSec: 69.5, durSec: 3.89 },
  { cut: 14, atSec: 74.5, durSec: 2.04 },
  { cut: 15, atSec: 78.5, durSec: 3.05 },
  { cut: 16, atSec: 83.0, durSec: 3.96 },
];

/** 声が乗る区間の BGM の音量と、上げ下げにかける時間 */
const DUCK_TO = 0.38;
const DUCK_RAMP = s(0.4);

/** その時刻に BGM をどこまで下げるか */
const duckAt = (frame: number): number => {
  let level = 1;
  for (const n of NARRATION) {
    const start = s(n.atSec + LEAD_IN);
    const end = start + s(n.durSec);
    level = Math.min(
      level,
      interpolate(
        frame,
        [start - DUCK_RAMP, start, end, end + DUCK_RAMP],
        [1, DUCK_TO, DUCK_TO, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    );
  }
  return level;
};

export const Soundtrack: React.FC = () => (
  <>
    <Audio
      src={staticFile("audio/bgm.mp3")}
      volume={(frame) =>
        // 頭は短くフェードイン、終わりは曲自体のフェードに任せる
        interpolate(frame, [0, s(0.7)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }) * duckAt(frame)
      }
    />

    {NARRATION.map((n) => (
      <Sequence
        key={n.cut}
        from={s(n.atSec + LEAD_IN)}
        durationInFrames={s(n.durSec) + 2}
      >
        <Audio src={staticFile(`audio/vo/${String(n.cut).padStart(2, "0")}.mp3`)} />
      </Sequence>
    ))}
  </>
);
