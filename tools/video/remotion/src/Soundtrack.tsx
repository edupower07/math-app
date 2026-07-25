import React from "react";
import { Audio, Sequence, staticFile, interpolate } from "remotion";
import { V, s } from "./theme";

/* ============================================================
 *  音まわり。
 *
 *  BGM はユーザー提供の1曲。元は 84.6秒で、79.6秒あたりから自前で
 *  フェードアウトして終わる作りだった。そのまま置くと締めの8秒が
 *  無音になるので、テンポを 6% だけ緩めて 90秒ちょうどに合わせてある
 *  （scripts/build-audio.py）。ループの継ぎ目が出ず、曲自身の
 *  フェードアウトがそのまま動画の終わりに着地する。
 *
 *  ナレーションは NARRATION に足すだけで、
 *  ・その区間だけ BGM が自動で下がる（ダッキング）
 *  ・音声が無ければ BGM だけが鳴る
 *  という形にしてある。台本は tools/video/NARRATION.md。
 * ============================================================ */

export type NarrationClip = {
  /** DESIGN.md §4 の カット番号 */
  cut: number;
  /** 読み始める時刻（秒）。ふつうはカットの開始秒と同じ */
  atSec: number;
  /** public/audio/ からの相対パス */
  src: string;
};

/**
 * ナレーション音声。まだ受け取っていないので空。
 * 例：{ cut: 1, atSec: 0.2, src: "audio/vo/01.mp3" }
 */
export const NARRATION: NarrationClip[] = [];

/** ナレーション中に BGM を下げる量（0〜1）と、上げ下げにかける時間 */
const DUCK_TO = 0.32;
const DUCK_RAMP = s(0.35);
/** ナレーション1本あたりの想定尺。実ファイルが短くても長すぎない程度に */
const DUCK_HOLD = s(3.2);

/** その時刻に BGM をどこまで下げるか */
const duckAt = (frame: number): number => {
  let level = 1;
  for (const n of NARRATION) {
    const start = s(n.atSec);
    const end = start + DUCK_HOLD;
    const v = interpolate(
      frame,
      [start - DUCK_RAMP, start, end, end + DUCK_RAMP],
      [1, DUCK_TO, DUCK_TO, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    level = Math.min(level, v);
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
        key={`${n.cut}-${n.src}`}
        from={s(n.atSec)}
        durationInFrames={V.durationInFrames - s(n.atSec)}
      >
        <Audio src={staticFile(n.src)} />
      </Sequence>
    ))}
  </>
);
