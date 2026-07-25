import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F, paperTexture } from "../theme";

export type CatKey = keyof typeof C.cat;

const CAT_LABEL: Record<CatKey, string> = {
  parity: "偶数・奇数",
  multiple: "倍数",
  divisor: "約数",
  cmul: "公倍数",
  cdiv: "公約数",
  basic: "基本",
};

/**
 * 証拠カード。アプリの .clue-card を動画用に拡大再現したもの。
 * 「証拠が1枚ずつ机に置かれていく」＝捜査の進行そのものを絵にする。
 */
export const ClueCard: React.FC<{
  cat: CatKey;
  text: React.ReactNode;
  index: number;
  appearAt?: number;
  /** 積み重ね表示のときの縦位置ずらし */
  stackOffset?: number;
  dim?: boolean;
  width?: number | string;
}> = ({ cat, text, index, appearAt = 0, stackOffset = 0, dim = false, width = "100%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 机に「置かれる」動き：やや上・回転して落ちてくる
  const drop = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.7 },
    durationInFrames: 22,
  });
  const tilt = interpolate(drop, [0, 1], [-4.5, index % 2 === 0 ? -1.1 : 1.3]);

  return (
    <div
      style={{
        position: "relative",
        top: stackOffset,
        width,
        opacity: drop * (dim ? 0.45 : 1),
        transform: `translateY(${(1 - drop) * -70}px) rotate(${tilt}deg) scale(${interpolate(
          drop,
          [0, 1],
          [1.06, 1]
        )})`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "20px 24px",
        borderRadius: 4,
        borderLeft: `12px solid ${C.cat[cat]}`,
        boxShadow: "0 14px 34px rgba(10,6,2,.55)",
        ...paperTexture,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          fontFamily: F.ui,
          fontWeight: 700,
          fontSize: 21,
          color: "#fff",
          background: C.cat[cat],
          borderRadius: 3,
          padding: "6px 13px",
          whiteSpace: "nowrap",
        }}
      >
        {CAT_LABEL[cat]}
      </span>
      <span
        style={{
          fontFamily: F.body,
          fontSize: 31,
          lineHeight: 1.3,
          color: C.ink,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <span
        style={{
          marginLeft: "auto",
          flexShrink: 0,
          fontFamily: F.mono,
          fontSize: 25,
          color: C.stamp,
          opacity: 0.55,
        }}
      >
        No.{index}
      </span>
    </div>
  );
};
