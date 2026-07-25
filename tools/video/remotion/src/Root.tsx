import React from "react";
import { Composition } from "remotion";
import { V } from "./theme";
import {
  KfHook,
  KfLogo,
  KfInvestigate,
  KfSolved,
  KfStat,
  KfOutro,
} from "./KeyFrames";

/**
 * いまはデザイン確定のためのキーフレームだけを登録している。
 * 絵づくりが承認されたら、これらを Sequence でつないで Main（90秒）を組む。
 */
const KEYFRAMES = [
  ["KF1-Hook", KfHook],
  ["KF2-Logo", KfLogo],
  ["KF3-Investigate", KfInvestigate],
  ["KF4-Solved", KfSolved],
  ["KF5-Stat", KfStat],
  ["KF6-Outro", KfOutro],
] as const;

export const RemotionRoot: React.FC = () => (
  <>
    {KEYFRAMES.map(([id, Comp]) => (
      <Composition
        key={id}
        id={id}
        component={Comp}
        durationInFrames={90}
        fps={V.fps}
        width={V.width}
        height={V.height}
      />
    ))}
  </>
);
