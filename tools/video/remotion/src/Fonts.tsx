import React from "react";
import { staticFile, continueRender, delayRender } from "remotion";

/**
 * ローカルに落とした @font-face をドキュメントに流し込む。
 * fonts.googleapis.com はサンドボックスの Chromium から直接引けないため、
 * scripts/fetch-fonts.py で public/fonts/ に取得済みのものを使う。
 */
let injected = false;

export const useFonts = () => {
  const [handle] = React.useState(() => delayRender("フォント読み込み"));

  React.useEffect(() => {
    if (injected) {
      continueRender(handle);
      return;
    }
    injected = true;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = staticFile("fonts/fonts.css");
    document.head.appendChild(link);

    link.onload = () => {
      // unicode-range 分割のため、実際に使う書体を明示的に待つ
      Promise.all([
        document.fonts.load('400 100px "Zen Antique"', "名探偵かずのひみつ事件"),
        document.fonts.load('400 100px "Yusei Magic"', "手がかりを調べる"),
        document.fonts.load('400 100px "Special Elite"', "0123456789%"),
        document.fonts.load('700 100px "Zen Maru Gothic"', "捜査ファイル"),
      ])
        .then(() => document.fonts.ready)
        .then(() => continueRender(handle))
        .catch(() => continueRender(handle));
    };
    link.onerror = () => continueRender(handle);
  }, [handle]);
};

export const Fonts: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useFonts();
  return <>{children}</>;
};
