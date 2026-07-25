#!/usr/bin/env node
/**
 * キーフレームを一括で書き出す。デザインの確認用。
 *   npm run stills
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const KEYFRAMES = [
  "KF1-Hook",
  "KF2-Logo",
  "KF3-Investigate",
  "KF4-Solved",
  "KF5-Stat",
  "KF6-Outro",
];

mkdirSync("out", { recursive: true });

for (const id of KEYFRAMES) {
  process.stdout.write(`${id} ... `);
  try {
    execFileSync(
      "npx",
      ["remotion", "still", id, `out/${id}.png`, "--frame=60", "--log=error"],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    console.log("ok");
  } catch {
    console.log("FAILED");
    process.exitCode = 1;
  }
}
