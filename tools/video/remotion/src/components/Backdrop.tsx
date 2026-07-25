import React from "react";
import { AbsoluteFill } from "remotion";
import { deskBackground, vignette } from "../theme";

/** 全カットの下地：捜査デスク＋フィルム粒子＋ビネット */
export const Backdrop: React.FC<{
  children?: React.ReactNode;
  grain?: number;
}> = ({ children, grain = 0.055 }) => (
  <AbsoluteFill style={deskBackground}>
    {children}
    <AbsoluteFill style={{ background: vignette, pointerEvents: "none" }} />
    <AbsoluteFill style={{ opacity: grain, pointerEvents: "none", mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  </AbsoluteFill>
);
