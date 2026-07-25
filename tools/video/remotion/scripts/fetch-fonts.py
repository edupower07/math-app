#!/usr/bin/env python3
"""アプリと同じ Google Fonts を public/fonts/ にローカル取得する。

Remotion のレンダーはヘッドレス Chromium で走るが、サンドボックス内の
Chromium からは fonts.googleapis.com を直接引けない（HTTPS_PROXY を見ないため
ERR_CONNECTION_RESET になる）。そこで curl で先に落とし、@font-face で
ローカル参照させる。woff2 は約 9.6MB あるので git には入れない（.gitignore 済み）。

    python3 scripts/fetch-fonts.py
"""
import os
import re
import subprocess
import sys

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")

# アプリ（src/styles.html）が使っているフォントと揃える
FAMILIES = [
    "Zen+Antique",              # 見出し・ロゴ（明朝）
    "Yusei+Magic",              # 本文・テロップ
    "Special+Elite",            # 数字（タイプライター）
    "Zen+Maru+Gothic:wght@500;700",  # UI
]

DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "fonts")


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
            sys.exit(f"CSS の取得に失敗: {fam}")

        urls = sorted(set(re.findall(r"https://fonts\.gstatic\.com/[^)]+\.woff2", css)))
        print(f"{fam}: {len(urls)} subsets")

        for u in urls:
            name = u.split("/s/")[1].replace("/", "_")
            if not os.path.exists(name):
                if subprocess.run(
                    ["curl", "-sS", "-A", UA, "--max-time", "60", "-o", name, u]
                ).returncode != 0:
                    sys.exit(f"ダウンロード失敗: {u}")
            # Remotion では public/ が / で配信される
            css = css.replace(u, "/fonts/" + name)
        blocks.append(css)

    with open("fonts.css", "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))

    total = len([f for f in os.listdir(".") if f.endswith(".woff2")])
    print(f"done: {total} woff2 -> {os.path.realpath(DEST)}")


if __name__ == "__main__":
    main()
