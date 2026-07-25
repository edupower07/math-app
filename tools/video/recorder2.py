import os, sys, time, json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path('/tmp/claude-0/-home-user-math-app/4feb0961-9d2d-58a8-ab69-3e1318bdf1dc/scratchpad')
DIRJS = (BASE/'rec/director.js').read_text()
OUT = BASE/'rec/video2'; OUT.mkdir(parents=True, exist_ok=True)
W,H = 1920,1080

def run():
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                               args=["--force-device-scale-factor=1","--hide-scrollbars"])
        ctx = b.new_context(viewport={"width":W,"height":H},
                            record_video_dir=str(OUT), record_video_size={"width":W,"height":H})
        pg = ctx.new_page()
        pg.goto((BASE/'preview.html').as_uri()); pg.wait_for_timeout(900)
        pg.evaluate("try{HowTo.close()}catch(e){}")
        pg.evaluate(DIRJS); pg.evaluate("DIR.init()"); pg.wait_for_timeout(300)

        J = lambda s: pg.evaluate(s)
        def wait(ms): pg.wait_for_timeout(ms)
        def log(*a): print(*a, flush=True)
        def telop(t, step=None):
            J(f"DIR.telop({json.dumps(t) if t else 'null'}, {json.dumps(step) if step else 'null'})")
        def chip(t): J(f"DIR.chip({json.dumps(t) if t else 'null'})")
        def card(o, hide=True): J(f"DIR.hideUI({str(hide).lower()}); DIR.card({json.dumps(o) if o else 'null'})")
        def zin(sel, pad=0.05, dur=0.85, settle=260):
            ok = J(f"DIR.zoom({json.dumps(sel)},{pad},{dur})"); wait(int(dur*1000)+settle); return ok
        def zout(dur=0.7, settle=240): J(f"DIR.reset({dur})"); wait(int(dur*1000)+settle)
        def ring(sel): J(f"DIR.ring({json.dumps(sel)})")
        def ringoff(): J("DIR.ringOff()")

        def onscreen(b, m=8):
            return b and b['w'] > 0 and m < b['x'] < W-m and m < b['y'] < H-m
        def click(sel, move=450, after=260, quiet=False):
            """カーソルを動かし、直前に座標を再計測してから実クリック。
               対象が画面外ならズームを戻してから押す(空振り防止)"""
            b1 = J(f"DIR.at({json.dumps(sel)})")
            if not onscreen(b1):
                J("DIR.reset(0.55)"); wait(760)
                b1 = J(f"DIR.at({json.dumps(sel)})")
            if not b1:
                if not quiet: log("MISS(no el):", sel)
                return False
            J(f"DIR.cursor({b1['x']},{b1['y']},{move})"); wait(move+70)
            b2 = J(f"DIR.at({json.dumps(sel)})") or b1
            J(f"DIR.pulse({b2['x']},{b2['y']})")
            pg.mouse.click(b2['x'], b2['y']); wait(after); return True

        def nav(sel, screen, move=560):
            click(sel, move=move, after=650)
            ok = J(f"document.getElementById('screen-{screen}').classList.contains('active')")
            if not ok:
                click(sel, move=220, after=650)
                ok = J(f"document.getElementById('screen-{screen}').classList.contains('active')")
            log(f"nav->{screen}", ok); return ok

        def cell(n): return f'#numberGrid .cell[data-n="{n}"]'
        def wait_overlay(t=5000):
            try: pg.wait_for_function("()=>!document.getElementById('overlay').classList.contains('hidden')", timeout=t); return True
            except Exception: log("overlay timeout"); return False
        def close_overlay():
            if J("!document.getElementById('overlay').classList.contains('hidden')"):
                click(".overlay-card .big-btn", move=360, after=500)

        def reveal(show=True):
            """次の手がかりを調べる(証拠エリアを映してから押す)"""
            pg.wait_for_function("()=>{const b=document.getElementById('revealBtn');return b&&!b.disabled&&!Game.selecting;}", timeout=4000)
            if show: zin(".clue-area", 0.05, 0.75)
            ok = click("#revealBtn", move=420, after=780)
            log("reveal", ok, "clues=", J("Game.roundIdx+1"))
            return ok
        def to_grid(): zin(".grid-wrap", 0.03, 0.8)

        def tap_matching(slow_n=4, slow=235, fast=100):
            lst = J("Game.matchList.slice()")
            for i,n in enumerate(lst):
                if i < slow_n: click(cell(n), move=slow, after=150, quiet=True)
                else: click(cell(n), move=fast, after=65, quiet=True)
            # 取りこぼしを回収(クリックが外れても必ず成立させる)
            for _ in range(3):
                rest = J("Game.selecting ? Game.matchList.filter(n=>!Game.kept[n]) : []")
                if not rest: break
                log("  retap", rest)
                for n in rest: click(cell(n), move=90, after=70, quiet=True)
            return lst
        def wait_solved(t=5000):
            try: pg.wait_for_function("()=>Game.solved", timeout=t); return True
            except Exception: log("NOT SOLVED", J("[Game.roundIdx,Game.matchCount,Game.keptCount,Object.keys(Game.alive).length]")); return False

        # ============ 0. タイトル ============
        card({"main":"名探偵！<b style='color:#e6b34a'>かずのひみつ</b>",
              "sub":"小5「整数の性質」を “謎解き” で攻略","stamp":"CASE FILE"})
        wait(1050); card(None); wait(450)

        # ============ ① 捜査 ============
        chip("① 捜査のしかた"); J("DIR.hideUI(false)")
        zin(".menu-grid", 0.03, 0.8)
        telop("算数の授業が、探偵の<b style='color:#ffd36a'>事件簿</b>になる。"); wait(1000)
        telop("6つの機能。まずは <b style='color:#ffd36a'>捜査をはじめる</b>"); wait(800)
        nav(".folder.c-game", "game")
        J("""APP.badges=10;APP.solved=10;APP.levelMode=false;Settings.applyPhase(3);
             Game.setup({secret:24,range:50,hints:[
               Engine.makeHint({category:'multiple',k:4}),
               Engine.makeHint({category:'multiple',k:6}),
               Engine.makeHint({category:'basic',kind:'ones',d:4})]},50,
               'FILE No.008 事件：この現場に「ひみつの数」が ひとり かくれている。');""")
        wait(350)
        zin(".grid-wrap", 0.03, 0.75)
        telop("現場に <b style='color:#ffd36a'>容ぎ者が50人</b>。この中に犯人がいる", "①"); wait(1050)

        telop("まずは <b style='color:#ffd36a'>手がかりを調べる</b>", "②")
        reveal()
        telop("証拠①：犯人の数は <b style='color:#ffd36a'>4の倍数</b>"); wait(1250)

        zin(".grid-wrap", 0.03, 0.75)
        telop("合う数を <b style='color:#ffd36a'>自分でタップ</b> ＝ ここが考えどころ", "③"); wait(500)
        tap_matching(slow_n=5)
        wait(600)
        telop("えらぶと<b style='color:#ffd36a'>色が濃く</b>、合わない数は <b style='color:#ffd36a'>✕で消える</b>"); wait(1550)

        reveal(); telop("証拠②：さらに <b style='color:#ffd36a'>6の倍数</b>"); wait(1000)
        to_grid(); tap_matching(slow_n=4); wait(500)
        telop("のこりは <b style='color:#ffd36a'>4人</b>！ 重ねるほど絞られる"); wait(1350)

        reveal(); telop("証拠③：<b style='color:#ffd36a'>一の位は4</b>"); wait(1050)
        to_grid(); telop("そして——")
        tap_matching(slow_n=1); wait_solved(); wait(300)
        zin(cell(24), 3.0, 0.9); ring(cell(24))
        telop("<b style='color:#ffd36a'>スポットライト！</b> 真犯人だ"); wait(1200); ringoff()
        zout(0.7)
        wait_overlay(); wait(300)
        zin(".overlay-card", 0.32, 0.8)
        telop("<b style='color:#ffd36a'>事件かいけつ！</b> 使った手がかりは3つ 🔎"); wait(1050)
        telop("偶数・奇数／<b style='color:#ffd36a'>倍数・約数</b> が 手を動かして身につく"); wait(1000)
        close_overlay(); J("UI.closeOverlay()"); zout(0.6)

        # ============ ② 探偵レベル ============
        telop(None); chip(None)
        card({"main":"② <b style='color:#e6b34a'>探偵レベル</b>","sub":"解くほど強くなる。自分から先へ進める","stamp":"FILE 02"})
        wait(1000); card(None); wait(400)
        chip("② 探偵レベル"); J("DIR.hideUI(false)")

        J("APP.badges=14;APP.solved=14;UI.refreshRankChip();")
        click(".screen.active .page-head .ghost", move=500, after=500)
        J("""Game.setup({secret:35,range:50,hints:[
               Engine.makeHint({category:'parity',parity:'odd'}),
               Engine.makeHint({category:'multiple',k:5}),
               Engine.makeHint({category:'basic',kind:'ones',d:5})]},50,'FILE No.009');""")
        zin(".grid-wrap", 0.05, 0.7)
        telop("事件を重ねると…"); wait(500)
        for _ in range(3):
            J("document.getElementById('revealBtn').click()"); wait(300)
            for n in J("Game.matchList.slice()"):
                bx = J(f"DIR.at({json.dumps(cell(n))})")
                if bx: J(f"DIR.cursor({bx['x']},{bx['y']},80)"); pg.mouse.click(bx['x'],bx['y']); wait(60)
            wait(240)
            if J("Game.solved"): break
        zout(0.6); wait_overlay(); wait(950)   # 解決→昇格に切り替わるのを待つ
        zin(".overlay-card", 0.32, 0.75)
        telop("<b style='color:#ffd36a'>探偵ランクUP！</b> 使える手がかりが増える"); wait(1200)
        close_overlay(); J("UI.closeOverlay()"); zout(0.6)

        telop("<b style='color:#ffd36a'>じぶんレベルで挑戦</b> ＝ どんどん先へ進める")
        zin(".game-toolbar", 0.10, 0.8)
        click("#levelToggle", move=480, after=900)
        telop("現場が <b style='color:#ffd36a'>1〜100</b> に拡大！ 上級事件だ"); wait(950)
        J("""Game.setup({secret:36,range:100,hints:[
               Engine.makeHint({category:'cmul',a:4,b:6}),
               Engine.makeHint({category:'basic',kind:'ones',d:6}),
               Engine.makeHint({category:'multiple',k:9})]},100,
               'FILE No.021 上級事件：現場は1〜100。公倍数の手がかりで せまれ。'); Game.updateLevelToggle();""")
        wait(350)
        reveal()
        telop("上級事件の証拠：<b style='color:#ffd36a'>4と6の公倍数</b>", "⚑"); wait(1350)
        zin(".grid-wrap", 0.03, 0.75)
        telop("100マスから <b style='color:#ffd36a'>公倍数</b> を さがし出す"); wait(400)
        tap_matching(slow_n=3, slow=220, fast=100); wait(600)
        telop("<b style='color:#ffd36a'>公倍数・公約数</b> も 遊びながら身につく"); wait(950)
        reveal(); to_grid(); tap_matching(slow_n=2); wait(350)
        reveal(); to_grid(); tap_matching(slow_n=1); wait_solved(); wait(300)
        zin(cell(36), 3.0, 0.9); ring(cell(36))
        telop("上級事件も <b style='color:#ffd36a'>かいけつ！</b>"); wait(1100); ringoff()
        zout(0.7); wait_overlay(); wait(300)
        zin(".overlay-card", 0.32, 0.75); wait(950)
        close_overlay(); J("UI.closeOverlay()"); zout(0.6)

        # ============ ③ 学びを支える機能 ============
        telop(None); chip(None)
        card({"main":"③ 学びを支える<b style='color:#e6b34a'>機能</b>","sub":"つまずきを その場で解消","stamp":"FILE 03"})
        wait(1000); card(None); wait(400)
        chip("③ 学びを支える機能"); J("DIR.hideUI(false)")

        telop("「約数って何だっけ？」→ <b style='color:#ffd36a'>用語じてん</b>")
        zin(".game-toolbar", 0.10, 0.8)
        gl = pg.locator(".tool-btn", has_text="用語じてん")
        bb = gl.bounding_box()
        if bb:
            x,y = bb['x']+bb['width']/2, bb['y']+bb['height']/2
            J(f"DIR.cursor({x},{y},480)"); wait(540)
            bb = gl.bounding_box(); x,y = bb['x']+bb['width']/2, bb['y']+bb['height']/2
            J(f"DIR.pulse({x},{y})"); pg.mouse.click(x,y); wait(700)
        zout(0.6)
        pg.wait_for_function("()=>!document.getElementById('glossary').classList.contains('hidden')", timeout=4000)
        zin(".glossary-card", 0.02, 0.75)
        telop("教科書どおりの説明を <b style='color:#ffd36a'>謎解き中でも</b> 確認"); wait(1100)
        gc = J("DIR.at('.glossary-card')")
        if gc:
            pg.mouse.move(gc['x'], gc['y'])
            for _ in range(5): pg.mouse.wheel(0, 260); wait(330)
        wait(800)
        click(".glossary-card .big-btn", move=400, after=650); zout(0.6)

        zout(0.55); click(".screen.active .page-head .back", move=500, after=650)
        telop("<b style='color:#ffd36a'>重ねて分析</b> で 公倍数を目で見る")
        zin(".menu-grid", 0.03, 0.75)
        nav(".folder.c-highlight", "highlight")
        J("document.getElementById('hlA').value=6;document.getElementById('hlB').value=8;")
        zin("#screen-highlight .case-paper", 0.02, 0.72)
        big = pg.locator(".hl-inputs .big-btn"); bb = big.bounding_box()
        if bb:
            x,y = bb['x']+bb['width']/2, bb['y']+bb['height']/2
            J(f"DIR.cursor({x},{y},480)"); wait(540)
            bb = big.bounding_box(); x,y = bb['x']+bb['width']/2, bb['y']+bb['height']/2
            J(f"DIR.pulse({x},{y})"); pg.mouse.click(x,y); wait(800)
        telop("Aの倍数・Bの倍数・<b style='color:#ffd36a'>公倍数</b> が 色でひと目"); wait(1050)
        zin("#hlQuestion", 0.10, 0.8)
        telop("<b style='color:#ffd36a'>最小公倍数</b> も 目で見て納得"); wait(1000)
        zout(0.6)

        zout(0.55); click(".screen.active .page-head .back", move=500, after=650)
        telop("<b style='color:#ffd36a'>解禁マップ</b> で 学びを ふりかえり")
        nav(".folder.c-dex", "dex")
        zin(".dex-map", 0.03, 0.9); wait(1100); zout(0.6)

        # ============ ④ 先生向け ============
        telop(None); chip(None)
        card({"main":"④ <b style='color:#e6b34a'>先生</b>のための機能","sub":"授業に合わせて かんたん運用","stamp":"FILE 04"})
        wait(1000); card(None); wait(400)
        chip("④ 先生向け"); J("DIR.hideUI(false)")

        zout(0.55); click(".screen.active .page-head .back", move=500, after=650)
        nav(".folder.c-settings", "settings")
        zin(".settings-explain", 0.06, 0.72)
        telop("先生画面で <b style='color:#ffd36a'>できること</b> が ひと目で"); wait(1550)
        zin(".phase-list", 0.03, 0.72)
        telop("授業の進度で <b style='color:#ffd36a'>フェーズ切替</b>（1〜50 ⇄ 1〜100）"); wait(950)
        click("#phaseList .phase-opt:nth-child(5)", move=520, after=900)
        if J("!document.getElementById('overlay').classList.contains('hidden')"):
            zout(0.6); zin(".overlay-card", 0.32, 0.8)
            telop("切替の瞬間は <b style='color:#ffd36a'>LEVEL UP！</b> 演出"); wait(950)
            close_overlay()
        zout(0.6)
        zin("#settingsMain .case-paper:nth-child(3)", 0.03, 0.75)
        telop("先生ページは <b style='color:#ffd36a'>パスワード</b> で保護"); wait(1000); zout(0.6)

        zout(0.55); click(".screen.active .page-head .back", move=500, after=650)
        telop("児童が <b style='color:#ffd36a'>問題づくり</b>！ レベルで手がかりが解禁")
        nav(".folder.c-create", "create")
        zin("#addHintRow", 0.16, 0.72); wait(300)
        chips = pg.locator("#addHintRow .add-chip"); n = chips.count()
        for idx in ([3,4] if n>=5 else ([3] if n>=4 else [])):
            bb = chips.nth(idx).bounding_box()
            if not bb: continue
            x,y = bb['x']+bb['width']/2, bb['y']+bb['height']/2
            J(f"DIR.cursor({x},{y},440)"); wait(500)
            bb = chips.nth(idx).bounding_box(); x,y = bb['x']+bb['width']/2, bb['y']+bb['height']/2
            J(f"DIR.pulse({x},{y})"); pg.mouse.click(x,y); wait(650)
        zin(".create-wrap", 0.02, 0.72)
        telop("えらぶたびに <b style='color:#ffd36a'>のこりの容ぎ者</b> が すぐわかる"); wait(1550)

        # ============ まとめ ============
        telop(None); chip(None); zout(0.6)
        card({"main":"この教材で<b style='color:#e6b34a'>学べること</b>",
              "list":["偶数・奇数／倍数・約数","公倍数・公約数（1〜100）","用語の意味を正しく理解",
                      "探偵レベルで自分から探究","問題づくり・ふりかえり"]})
        wait(500)
        for i in range(5): J(f"DIR.checkItem({i})"); wait(520)
        wait(1100); card(None); wait(450)
        card({"main":"名探偵！<b style='color:#e6b34a'>かずのひみつ</b>",
              "sub":"Google Apps Script で 教室にすぐ導入","stamp":"解決"})
        wait(2600)

        p = pg.video.path(); ctx.close(); b.close()
        print("VIDEO:", p)

if __name__ == "__main__": run()
