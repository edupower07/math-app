import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// サンドボックス同梱の Chromium を使う（Remotion に別途ダウンロードさせない）。
// 通常の `chromium` バイナリは旧ヘッドレスを落としているため起動に失敗する。
// Playwright 同梱の headless_shell（＝旧ヘッドレス相当）を指すこと。
const HEADLESS_SHELL =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(HEADLESS_SHELL)) {
  Config.setBrowserExecutable(HEADLESS_SHELL);
}
