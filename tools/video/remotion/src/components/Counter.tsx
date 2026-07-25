import React from "react";
import { useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { C, F } from "../theme";

/**
 * 「容ぎ者 ◯人」カウンタ。
 * 参考動画の「巨大な金の数字」＋「％カウントアップ」を、この教材の
 * いちばん大事な情報＝“絞り込みの手応え”に振り替えたもの。
 */
export const SuspectCounter: React.FC<{
  from: number;
  to: number;
  startAt?: number;
  durationInFrames?: number;
}> = ({ from, to, startAt = 0, durationInFrames = 22 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const value = Math.round(
    interpolate(frame, [startAt, startAt + durationInFrames], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  // 着地の瞬間だけ跳ねる
  const land = spring({
    frame: frame - (startAt + durationInFrames),
    fps,
    config: { damping: 9, stiffness: 200 },
    durationInFrames: 18,
  });
  const pop = frame >= startAt + durationInFrames ? 1 + land * 0.14 : 1;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 18,
        transform: `scale(${pop})`,
        transformOrigin: "0% 50%",
      }}
    >
      <span
        style={{
          fontFamily: F.display,
          fontSize: 34,
          letterSpacing: 6,
          color: C.manila,
          alignSelf: "center",
        }}
      >
        容ぎ者
      </span>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 148,
          lineHeight: 0.9,
          color: value === 1 ? C.stamp : C.goldLight,
          textShadow: `0 0 44px ${value === 1 ? C.stamp : C.gold}88, 0 6px 0 rgba(0,0,0,.45)`,
        }}
      >
        {value}
      </span>
      <span style={{ fontFamily: F.display, fontSize: 46, color: C.paper2 }}>人</span>
    </div>
  );
};

/**
 * 絞り込みバー：現場の何人が残っているかを帯で見せる。
 * 数字だけだと流れてしまうので、面積でも同時に見せる。
 */
export const NarrowBar: React.FC<{
  total: number;
  from: number;
  to: number;
  startAt?: number;
  durationInFrames?: number;
}> = ({ total, from, to, startAt = 0, durationInFrames = 22 }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [startAt, startAt + durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const ratio = v / total;

  return (
    <div>
      <div
        style={{
          height: 14,
          background: "rgba(0,0,0,.5)",
          border: `1px solid ${C.gold}44`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${C.goldDeep}, ${C.goldLight})`,
            boxShadow: `0 0 18px ${C.gold}`,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F.mono,
          fontSize: 22,
          color: C.manila,
        }}
      >
        <span>のこり</span>
        <span>現場 {total} マス</span>
      </div>
    </div>
  );
};

/** 「一意化率 100%」のような、数字を主役にした一枚絵 */
export const BigStat: React.FC<{
  label: string;
  value: number;
  suffix?: string;
  caption?: string;
  durationInFrames?: number;
}> = ({ label, value, suffix = "%", caption, durationInFrames = 30 }) => {
  const frame = useCurrentFrame();
  const v = Math.round(
    interpolate(frame, [0, durationInFrames], [0, value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: F.display, fontSize: 44, letterSpacing: 10, color: C.manila }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 300,
            lineHeight: 1,
            color: C.goldLight,
            textShadow: `0 0 70px ${C.gold}aa, 0 10px 0 rgba(0,0,0,.4)`,
          }}
        >
          {v}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 120, color: C.gold }}>{suffix}</span>
      </div>
      {caption ? (
        <div style={{ marginTop: 18, fontFamily: F.body, fontSize: 34, color: C.paper2 }}>
          {caption}
        </div>
      ) : null}
    </div>
  );
};
