#!/usr/bin/env python3
"""デザイン確認用の「現場パネル」静止画を public/plates/ に書き出す。

本番の動画では実写の画面録画を使うが、絵づくりを詰める段階では
アプリの `.case-paper`（912×709.5）を2倍解像度で切り出したものを
差し込んで確認する。FileCard の ASPECT.scene / PANEL はこの寸法が前提。

    pip install playwright pillow
    python3 scripts/capture-plates.py
"""
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3].parent  # リポジトリのルート
SRC = ROOT / "src"
PUBLIC = Path(__file__).resolve().parents[1] / "public"
PLATES = PUBLIC / "plates"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
PANEL = ".screen.active .case-paper"


def build_preview() -> Path:
    """GAS の include を展開し、フォントをローカル参照にした単体HTMLを作る。"""
    idx = (SRC / "index.html").read_text(encoding="utf-8")
    fonts = (PUBLIC / "fonts" / "fonts.css").read_text(encoding="utf-8")
    fonts = fonts.replace("url(/fonts/", f"url({PUBLIC.as_uri()}/fonts/")

    idx = idx.replace(
        "<?!= include('styles'); ?>",
        f"<style>{fonts}</style>\n{(SRC / 'styles.html').read_text(encoding='utf-8')}",
    )
    idx = idx.replace(
        "<?!= include('app'); ?>", (SRC / "app.html").read_text(encoding="utf-8")
    )
    # Chromium は HTTPS_PROXY を読まないため Google Fonts は直接引けない
    idx = re.sub(r'<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>', "", idx)

    out = Path(tempfile.gettempdir()) / "kazu_preview.html"
    out.write_text(idx, encoding="utf-8")
    return out


def main():
    if not (PUBLIC / "fonts" / "fonts.css").exists():
        sys.exit("先に scripts/fetch-fonts.py を実行してください")

    PLATES.mkdir(parents=True, exist_ok=True)
    preview = build_preview()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=CHROME,
            args=["--force-device-scale-factor=2", "--hide-scrollbars"],
        )
        page = browser.new_context(
            viewport={"width": 1920, "height": 1080}, device_scale_factor=2
        ).new_page()
        page.goto(preview.as_uri())
        page.wait_for_timeout(1400)
        page.evaluate("try{HowTo.close()}catch(e){}")
        page.evaluate("try{Nav.go('game')}catch(e){}")
        page.wait_for_timeout(900)

        page.query_selector(PANEL).screenshot(path=str(PLATES / "scene_start.png"))
        print("scene_start.png")

        # 手がかりを1つ調べた状態
        page.evaluate("document.getElementById('revealBtn')?.click()")
        page.wait_for_timeout(800)
        page.query_selector(PANEL).screenshot(path=str(PLATES / "scene_clue1.png"))
        print("scene_clue1.png")

        browser.close()


if __name__ == "__main__":
    main()
