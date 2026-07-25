#!/usr/bin/env python3
"""note記事用のスクリーンショットを screenshots/ に書き出す。

element.screenshot() は「クリック直後の少し古いレイアウト」で座標を
確定してしまうことがあり、スクロール位置によっては sticky なトップバー
（半透明＋blur）越しに前の要素が透けて写り込む。
→ 撮影の直前に getBoundingClientRect() を取り直し、page.screenshot(clip=...)
   で撮る（1回だけ古い矩形で事故ったので、以後は全カットこの方式に統一）。
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
OUT = HERE / "screenshots"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
W, H = 1600, 1200


def wait_fonts(page):
    page.evaluate(
        "async()=>{await Promise.all(["
        "document.fonts.load('400 20px \"Zen Antique\"'),"
        "document.fonts.load('400 20px \"Yusei Magic\"'),"
        "document.fonts.load('400 20px \"Special Elite\"'),"
        "document.fonts.load('700 20px \"Zen Maru Gothic\"')]);"
        "await document.fonts.ready;}"
    )


def click_cell(page, n):
    b = page.evaluate(f"""(()=>{{
        const el=document.querySelector('#numberGrid .cell[data-n="{n}"]');
        const r=el.getBoundingClientRect();
        return {{x:r.left+r.width/2,y:r.top+r.height/2}};
    }})()""")
    page.mouse.click(b["x"], b["y"])
    page.wait_for_timeout(15)


def shot(page, name, sel):
    """表示を待ってから矩形を測り直し、撮影直前の値で clip 撮影する。"""
    page.wait_for_selector(sel, state="visible", timeout=4000)
    r = page.evaluate(f"""(()=>{{
        const e=document.querySelector({sel!r});
        const b=e.getBoundingClientRect();
        return {{x:b.x,y:b.y,width:b.width,height:b.height}};
    }})()""")
    if r["width"] <= 0 or r["height"] <= 0:
        raise RuntimeError(f"{name}: 要素のサイズが0 ({sel!r}) -- 表示待ちが足りない")
    page.screenshot(
        path=str(OUT / f"{name}.png"),
        clip={"x": r["x"], "y": r["y"], "width": r["width"], "height": r["height"]},
    )
    print(name)


def main():
    OUT.mkdir(exist_ok=True)
    preview = HERE / "preview.html"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=CHROME,
            args=["--force-device-scale-factor=2", "--hide-scrollbars"],
        )
        page = browser.new_context(
            viewport={"width": W, "height": H}, device_scale_factor=2
        ).new_page()
        page.goto(preview.as_uri())
        page.wait_for_timeout(1000)
        wait_fonts(page)
        page.evaluate("try{HowTo.close()}catch(e){}")
        page.wait_for_timeout(300)

        # 1) ホーム画面
        shot(page, "01-home", "#app")

        # 2) 捜査：問題を仕込んで少し進めた状態（絞り込み途中）
        page.evaluate("Nav.go('game')")
        page.wait_for_timeout(700)
        page.evaluate("""
          APP.badges=10; APP.solved=10; APP.levelMode=false; Settings.applyPhase(3);
          Game.setup({secret:24, range:50, hints:[
            Engine.makeHint({category:'parity', parity:'even'}),
            Engine.makeHint({category:'multiple', k:6}),
            Engine.makeHint({category:'basic', kind:'ones', d:4})
          ]}, 50, 'FILE No.002 事件：この現場に「ひみつの数」が ひとり かくれている。');
        """)
        page.wait_for_timeout(400)
        page.evaluate("document.getElementById('revealBtn').click()")
        page.wait_for_timeout(500)
        for n in page.evaluate("Game.matchList.slice()"):
            click_cell(page, n)
        page.wait_for_timeout(500)
        shot(page, "02-game-narrowing", ".screen.active .case-paper")

        # 3) 解決演出
        page.evaluate("document.getElementById('revealBtn').click()")
        page.wait_for_timeout(400)
        for n in page.evaluate("Game.matchList.slice()"):
            click_cell(page, n)
        page.wait_for_timeout(400)
        page.evaluate("document.getElementById('revealBtn').click()")
        page.wait_for_timeout(400)
        for n in page.evaluate("Game.matchList.slice()"):
            click_cell(page, n)
        page.wait_for_function("()=>Game.solved", timeout=4000)
        page.wait_for_timeout(800)
        shot(page, "03-game-solved", ".overlay-card")
        page.evaluate("UI.closeOverlay()")
        page.wait_for_timeout(400)

        # 4) 手がかり図鑑（ランクパネル＋解禁マップ全体）
        page.evaluate("Nav.go('dex')")
        page.wait_for_timeout(900)
        shot(page, "04-dex", "#screen-dex")

        # 5) 重ねて分析
        page.evaluate("Nav.go('highlight')")
        page.wait_for_timeout(700)
        page.evaluate("document.getElementById('hlA').value=6; document.getElementById('hlB').value=8;")
        page.click(".hl-inputs .big-btn")
        page.wait_for_timeout(700)
        shot(page, "05-highlight", "#screen-highlight .case-paper")

        # 6) 挑戦状づくり
        page.evaluate("Nav.go('create')")
        page.wait_for_timeout(700)
        chips = page.locator("#addHintRow .add-chip")
        for i in [0, 1]:
            if chips.nth(i).count():
                chips.nth(i).click()
                page.wait_for_timeout(350)
        shot(page, "06-create", "#screen-create .case-paper")

        # 7) グループ対決
        page.evaluate("Nav.go('group')")
        page.wait_for_timeout(700)
        shot(page, "07-group", "#screen-group .case-paper")

        # 8) 用語じてん（タブが上にはみ出すので親のoverlayごと撮る）
        page.evaluate("Glossary.open()")
        page.wait_for_timeout(600)
        shot(page, "08-glossary", "#glossary")
        page.evaluate("Glossary.close()")
        page.wait_for_timeout(300)

        # 9) せんせい設定
        page.evaluate("Nav.go('settings')")
        page.wait_for_timeout(900)
        shot(page, "09-settings", "#screen-settings")

        browser.close()

    print("\n書き出し先:", OUT)


if __name__ == "__main__":
    main()
