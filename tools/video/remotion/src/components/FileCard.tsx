import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { C } from "../theme";

/** 素材ごとの縦横比（横÷縦） */
export const ASPECT = {
  /** 現場パネル（.case-paper）だけを切り出したもの＝主役の素材 */
  scene: 912 / 709.5,
  /** アプリのカラム全体 */
  app: 940 / 1122,
} as const;

/**
 * 現場パネル素材（scene_*.png）の中の座標。
 * ページ上の実測値から算出：パネル原点 (504, 125.5)、.grid-wrap (521,349)-(1399,821)。
 * スポットライトやリングを「◯番のマス」に当てるために使う。
 */
export const PANEL = {
  w: 912,
  h: 709.5,
  grid: { x: 17, y: 223.5, w: 878, h: 472 },
  cols: 10,
  rows: 5,
} as const;

/** 1〜50 のマス番号 → パネル内の矩形 */
export const cellRect = (n: number) => {
  const cw = PANEL.grid.w / PANEL.cols;
  const ch = PANEL.grid.h / PANEL.rows;
  const col = (n - 1) % PANEL.cols;
  const row = Math.floor((n - 1) / PANEL.cols);
  return {
    cx: PANEL.grid.x + cw * (col + 0.5),
    cy: PANEL.grid.y + ch * (row + 0.5),
    w: cw,
    h: ch,
  };
};

/** パネル内座標 → 画面座標。FileCard の置き方（幅・中央寄せ）と揃えること */
export const panelToFrame = (
  n: number,
  card: { left: number; top: number; width: number }
) => {
  const k = card.width / PANEL.w;
  const r = cellRect(n);
  return { x: card.left + r.cx * k, y: card.top + r.cy * k, w: r.w * k, h: r.h * k };
};

/**
 * アプリ画面を「机に置かれた捜査ファイル」として扱うための枠。
 *
 * 設計の要：アプリのカラムは 940×1122 の縦長で、16:9 にも 9:16 にも
 * そのままでは収まらない（左右／上下が大きく余る）。全画面に引き伸ばさず、
 * 一枚の書類として机に置く＝余白を「捜査デスク」として積極的に使う。
 * これで 16:9 と 9:16 が、同じ部品の配置替えだけで作れる。
 */
export const FileCard: React.FC<{
  src: string;
  width: number;
  /** 素材の縦横比（横÷縦）。現場パネル=912/709.5、アプリ全体=940/1122 */
  aspect: number;
  rotate?: number;
  appearAt?: number;
  /** 拡大して見せたい領域（カード内の相対位置 0–1）。捜査中の寄りに使う */
  focus?: { x: number; y: number; scale: number };
}> = ({ src, width, aspect, rotate = -1.2, appearAt = 0, focus }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - appearAt, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const inner = focus
    ? {
        transform: `scale(${focus.scale})`,
        transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
      }
    : {};

  return (
    <div
      style={{
        width,
        height: width / aspect,
        overflow: "hidden",
        borderRadius: 6,
        border: `1px solid ${C.paperEdge}55`,
        boxShadow: `0 40px 90px rgba(0,0,0,.72), 0 0 0 1px ${C.gold}22`,
        opacity: p,
        transform: `rotate(${rotate}deg) translateY(${(1 - p) * 40}px) scale(${interpolate(
          p,
          [0, 1],
          [0.96, 1]
        )})`,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...inner }}
      />
    </div>
  );
};
