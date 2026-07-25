#!/usr/bin/env python3
"""note記事用スクショの土台となる単体HTMLを作る。

GAS の include() を展開し、フォントをローカル参照にする
（fonts.googleapis.com はサンドボックスの Chromium から直接引けないため）。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src"
HERE = Path(__file__).resolve().parent


def build() -> Path:
    idx = (SRC / "index.html").read_text(encoding="utf-8")
    fonts_dir = HERE / "fonts"
    css = (fonts_dir / "fonts.css").read_text(encoding="utf-8")
    css = css.replace("url(", f"url({fonts_dir.as_uri()}/")

    idx = idx.replace(
        "<?!= include('styles'); ?>",
        f"<style>{css}</style>\n{(SRC / 'styles.html').read_text(encoding='utf-8')}",
    )
    idx = idx.replace(
        "<?!= include('app'); ?>", (SRC / "app.html").read_text(encoding="utf-8")
    )
    idx = re.sub(r'<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>', "", idx)

    out = HERE / "preview.html"
    out.write_text(idx, encoding="utf-8")
    return out


if __name__ == "__main__":
    p = build()
    print("wrote", p)
