import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F, W } from "../theme";

/**
 * 画面下の常時テロップバー（参考動画の「ナレーション字幕バー」役）。
 * ナレーション音声を後から足しても、この文言がそのまま原稿になるように書く。
 * 90秒を通してここは絶対に消さない＝ミュート視聴でも意味が通る。
 */
export const TelopBar: React.FC<{
  text: React.ReactNode;
  /** 左端の進行チップ（①②③ や「証拠」など） */
  step?: string;
  appearAt?: number;
}> = ({ text, step, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - appearAt, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 46,
        display: "flex",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          maxWidth: 1580,
          padding: "20px 40px",
          background: "rgba(20,15,9,.82)",
          border: `1px solid ${C.gold}55`,
          borderLeft: `6px solid ${C.gold}`,
          borderRadius: 4,
          backdropFilter: "blur(4px)",
          boxShadow: "0 12px 40px rgba(0,0,0,.5)",
        }}
      >
        {step ? (
          <span
            style={{
              flexShrink: 0,
              fontFamily: F.mono,
              fontSize: 30,
              color: C.deskDeep,
              background: C.gold,
              borderRadius: 3,
              padding: "2px 14px",
              letterSpacing: 1,
            }}
          >
            {step}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: F.body,
            fontWeight: W.body,
            fontSize: 42,
            lineHeight: 1.35,
            color: C.paper,
            textShadow: "0 2px 6px rgba(0,0,0,.6)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/** テロップ内の強調（金）。参考動画の色分けに合わせる */
export const G: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <b style={{ color: C.goldLight }}>{children}</b>
);

/**
 * 小さな「※」注釈。テンポと親しみを出す、参考動画の重要な癖。
 * inline = 親のレイアウト内に流す（捜査ボードの下など）。
 * 既定は右下の浮かせ置き。
 */
export const Note: React.FC<{
  children: React.ReactNode;
  bottom?: number;
  inline?: boolean;
}> = ({ children, bottom = 172, inline = false }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        ...(inline
          ? { alignSelf: "flex-end" }
          : { position: "absolute", right: 60, bottom }),
        opacity: p * 0.95,
        fontFamily: F.body,
        fontWeight: 500,
        fontSize: 25,
        color: C.manila,
        background: "rgba(20,15,9,.6)",
        padding: "7px 16px",
        borderRadius: 3,
      }}
    >
      ※{children}
    </div>
  );
};
