import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { C } from "../theme";
import { PANEL } from "./FileCard";

/** 収録時のビューポート。切り出し計算の基準 */
const SHOT = { w: 1920, h: 1080 };
/** ページ上での現場パネルの位置（実測） */
const PANEL_AT = { x: 504, y: 125.5 };

type Trim = {
  src: string;
  /** 素材の何秒目から使うか */
  startAtSec: number;
  /** 再生速度。タップの連打はやや速める方が気持ちいい */
  rate?: number;
};

/**
 * 素のまま撮った 1920×1080 の映像から**現場パネルだけを切り出して**
 * 机の上に置く。収録時にズームしていないので、寄り・引きを後から変えられる。
 * 切り出し 912px → 配置 940px なので拡大は 1.03 倍、画質は実質そのまま。
 */
export const PanelFootage: React.FC<Trim & { width: number; rotate?: number }> = ({
  src,
  startAtSec,
  rate = 1,
  width,
  rotate = -1.1,
}) => {
  const k = width / PANEL.w;

  return (
    <div
      style={{
        width,
        height: PANEL.h * k,
        overflow: "hidden",
        borderRadius: 6,
        border: `1px solid ${C.paperEdge}55`,
        boxShadow: `0 40px 90px rgba(0,0,0,.72), 0 0 0 1px ${C.gold}22`,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          width: SHOT.w * k,
          height: SHOT.h * k,
          marginLeft: -PANEL_AT.x * k,
          marginTop: -PANEL_AT.y * k,
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={Math.round(startAtSec * 30)}
          playbackRate={rate}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};

/**
 * 収録時にズームしたカット（解決・図鑑・重ねて分析など）はそのまま全画面で使う。
 * CSS transform で拡大したものなので文字がベクタのまま鮮明。
 */
export const FullFootage: React.FC<Trim & { scale?: number }> = ({
  src,
  startAtSec,
  rate = 1,
  scale = 1,
}) => (
  <OffthreadVideo
    src={staticFile(src)}
    startFrom={Math.round(startAtSec * 30)}
    playbackRate={rate}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: scale === 1 ? undefined : `scale(${scale})`,
    }}
  />
);
