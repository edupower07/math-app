import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

/**
 * 「解決」スタンプ。アプリの .solved-stamp.slam（rotate12deg / scale3.4 → 1）を
 * 動画スケールに引き伸ばしたもの。着弾でノイズと画面揺れを足す。
 */
export const SolvedStamp: React.FC<{
  label?: string;
  appearAt?: number;
}> = ({ label = "解決", appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - appearAt;

  const slam = spring({
    frame: t,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.6 },
    durationInFrames: 16,
  });
  const scale = interpolate(slam, [0, 0.6, 1], [3.4, 0.9, 1]);
  const opacity = t < 0 ? 0 : interpolate(t, [0, 3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        transform: `rotate(-11deg) scale(${scale})`,
        opacity,
        border: `9px double ${C.stamp}`,
        borderRadius: 12,
        padding: "14px 56px",
        background: "rgba(255,253,245,.9)",
        boxShadow: `0 0 90px ${C.stamp}55`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: F.display,
          fontSize: 118,
          lineHeight: 1.15,
          letterSpacing: 10,
          color: C.stamp,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
};

/**
 * スタンプ着弾に合わせた画面の揺れ。子要素ごと揺らす。
 *
 * 必ず AbsoluteFill で返すこと。transform を持つ要素は position:absolute な
 * 子孫の包含ブロックになるため、素の div（高さ auto = 0）で包むと
 * 中の inset:0 が 0×0 に潰れ、スポットライト等が消える。
 */
export const Shake: React.FC<{
  at: number;
  amount?: number;
  children: React.ReactNode;
}> = ({ at, amount = 16, children }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const decay = t < 0 ? 0 : Math.exp(-t / 5);
  const dx = Math.sin(t * 2.4) * amount * decay;
  const dy = Math.cos(t * 3.1) * amount * 0.6 * decay;

  return (
    <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px)` }}>{children}</AbsoluteFill>
  );
};

/**
 * 犯人のマスに当たるスポットライト（アプリの .cell.spotlight 相当）。
 * 落とす暗さは 0.72 まで。ここを上げすぎると現場そのものが見えなくなり、
 * 「何を絞り込んだのか」が伝わらなくなる。
 */
export const Spotlight: React.FC<{
  /** 当てるマスの外接矩形（画面座標）。panelToFrame() の戻り値をそのまま渡す */
  target: { x: number; y: number; w: number; h: number };
  appearAt?: number;
  dim?: number;
}> = ({ target, appearAt = 0, dim = 0.72 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - appearAt, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = 1 + Math.sin((frame - appearAt) / 6) * 0.045;
  const radius = Math.max(target.w, target.h) * 1.5 * pulse;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: p,
          background: `radial-gradient(circle ${radius}px at ${target.x}px ${target.y}px, transparent 0%, transparent 34%, rgba(8,5,2,${dim}) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: target.x - target.w / 2,
          top: target.y - target.h / 2,
          width: target.w,
          height: target.h,
          opacity: p,
          borderRadius: 8,
          boxShadow: `0 0 0 6px ${C.stamp}, 0 0 60px 22px ${C.gold}aa`,
        }}
      />
    </>
  );
};
