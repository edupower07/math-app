import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { C, F, W } from "../theme";

/**
 * ロゴ着地。参考動画の「ロゴがドンと落ちる（縮みながら出現）」をそのまま拝借。
 * 大きく入って一度行き過ぎ、二重罫のスタンプ枠に収まる。
 */
export const LogoLanding: React.FC<{
  appearAt?: number;
  subtitle?: string;
}> = ({ appearAt = 0, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const land = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 12, stiffness: 110, mass: 0.9 },
    durationInFrames: 26,
  });
  const scale = interpolate(land, [0, 1], [3.2, 1]);
  const opacity = interpolate(frame - appearAt, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 着地の衝撃で走る光
  const shine = interpolate(frame - appearAt, [16, 34], [-1, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subP = interpolate(frame - appearAt, [24, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ transform: `scale(${scale})`, opacity }}>
        <div
          style={{
            display: "inline-block",
            position: "relative",
            overflow: "hidden",
            border: `5px double ${C.gold}`,
            borderRadius: 8,
            padding: "18px 64px",
            background: "rgba(20,15,9,.45)",
          }}
        >
          <span
            style={{
              fontFamily: F.displayHeavy,
              fontWeight: W.displayHeavy,
              fontSize: 122,
              lineHeight: 1.1,
              color: C.paper,
              letterSpacing: 4,
              textShadow: `0 0 60px ${C.gold}66, 6px 6px 0 ${C.stampDeep}`,
            }}
          >
            名探偵！かずのひみつ
          </span>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, transparent 40%, ${C.goldLight}55 50%, transparent 60%)`,
              transform: `translateX(${shine * 100}%)`,
            }}
          />
        </div>
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: 34,
            opacity: subP,
            transform: `translateY(${(1 - subP) * 14}px)`,
            fontFamily: F.body,
            fontWeight: W.body,
            fontSize: 40,
            letterSpacing: 3,
            color: C.manila,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};

/**
 * 巨大明朝タイトル＋赤影。参考動画の 3.8–5.6 秒の型。
 * つかみと章の変わり目でだけ使い、乱発しない。
 */
export const BigTitle: React.FC<{
  children: React.ReactNode;
  sub?: string;
  appearAt?: number;
}> = ({ children, sub, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - appearAt, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.poly(5)),
  });

  return (
    <div style={{ textAlign: "center", opacity: p }}>
      <div
        style={{
          fontFamily: F.displayHeavy,
          fontWeight: W.displayHeavy,
          fontSize: 146,
          lineHeight: 1.22,
          color: C.paper,
          letterSpacing: 2,
          transform: `scale(${interpolate(p, [0, 1], [1.08, 1])})`,
          textShadow: `10px 10px 0 ${C.stampDeep}, 0 0 90px rgba(0,0,0,.7)`,
        }}
      >
        {children}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 30,
            fontFamily: F.body,
            fontWeight: W.body,
            fontSize: 44,
            color: C.goldLight,
            opacity: interpolate(frame - appearAt, [10, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

/** 「事件ファイル No.001」的な小見出し。冠フォーマットを毎章で効かせる */
export const SectionLabel: React.FC<{
  no: string;
  title: string;
  appearAt?: number;
}> = ({ no, title, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - appearAt, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 62,
        left: 64,
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity: p,
        transform: `translateX(${(1 - p) * -26}px)`,
      }}
    >
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 30,
          letterSpacing: 3,
          color: C.deskDeep,
          background: C.tab,
          padding: "6px 18px",
          borderRadius: "3px 3px 0 0",
        }}
      >
        {no}
      </span>
      <span
        style={{
          fontFamily: F.display,
          fontWeight: W.display,
          fontSize: 44,
          color: C.paper,
          textShadow: "0 3px 10px rgba(0,0,0,.7)",
        }}
      >
        {title}
      </span>
    </div>
  );
};
