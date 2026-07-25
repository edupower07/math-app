#!/usr/bin/env python3
"""note記事用スクリーンショットのために、アプリ本来のフォント
（src/styles.html が使っているもの）を fonts/ に取得する。

tools/video/remotion/public/fonts/ とは別の書体（動画はミステリー系に
差し替え済み）なので混ぜない。アプリの見た目そのまま撮るためのもの。
"""
import os
import re
import subprocess
import sys

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")

# src/styles.html が実際に使っているファミリ
FAMILIES = [
    "Zen+Antique",
    "Yusei+Magic",
    "Special+Elite",
    "Zen+Maru+Gothic:wght@500;700",
]

DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")


def main():
    os.makedirs(DEST, exist_ok=True)
    os.chdir(DEST)
    blocks = []
    for fam in FAMILIES:
        url = f"https://fonts.googleapis.com/css2?family={fam}&display=swap"
        css = subprocess.run(
            ["curl", "-sS", "-A", UA, "--max-time", "60", url],
            capture_output=True, text=True,
        ).stdout
        if "@font-face" not in css:
            sys.exit(f"CSS取得失敗: {fam}")
        urls = sorted(set(re.findall(r"https://fonts\.gstatic\.com/[^)]+\.woff2", css)))
        print(f"{fam}: {len(urls)} subsets")
        for u in urls:
            name = u.split("/s/")[1].replace("/", "_")
            if not os.path.exists(name):
                if subprocess.run(
                    ["curl", "-sS", "-A", UA, "--max-time", "60", "-o", name, u]
                ).returncode != 0:
                    sys.exit(f"ダウンロード失敗: {u}")
            css = css.replace(u, name)
        blocks.append(css)
    with open("fonts.css", "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))
    print("done:", len([f for f in os.listdir(".") if f.endswith(".woff2")]), "woff2")


if __name__ == "__main__":
    main()
