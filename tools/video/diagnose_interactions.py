import json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = Path('/tmp/claude-0/-home-user-math-app/4feb0961-9d2d-58a8-ab69-3e1318bdf1dc/scratchpad')
DIRJS = (BASE/'rec/director.js').read_text()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg = b.new_context(viewport={"width":1920,"height":1080}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto((BASE/'preview.html').as_uri()); pg.wait_for_timeout(700)
    pg.evaluate("try{HowTo.close()}catch(e){}"); pg.evaluate(DIRJS); pg.evaluate("DIR.init()")
    J=lambda s: pg.evaluate(s); wait=pg.wait_for_timeout
    # 重複セレクタの確認
    for sel in ['.page-head .back','.case-paper','.grid-wrap','.clue-area','#revealBtn','.overlay-card','.menu-grid']:
        print('count', sel, J(f"document.querySelectorAll({json.dumps(sel)}).length"))
    J("Nav.go('game')"); wait(200)
    J("""APP.badges=10;Settings.applyPhase(3);
         Game.setup({secret:24,range:50,hints:[Engine.makeHint({category:'multiple',k:4}),
           Engine.makeHint({category:'multiple',k:6}),Engine.makeHint({category:'basic',kind:'ones',d:4})]},50,'x');""")
    def at(sel): return J(f"DIR.at({json.dumps(sel)})")
    def clk(sel):
        p=at(sel)
        if not p or p['w']==0: print('  NO-BOX',sel); return False
        pg.mouse.click(p['x'],p['y']); wait(120); return True
    for rnd in range(3):
        J(f"DIR.zoom('.clue-area',0.05,0.01)"); wait(200)
        print('round',rnd,'btn click', clk('#revealBtn'), 'roundIdx=',J('Game.roundIdx'),'selecting=',J('Game.selecting'))
        J(f"DIR.zoom('.grid-wrap',0.03,0.01)"); wait(250)
        lst=J("Game.matchList.slice()"); print('  matchList',lst)
        for n in lst:
            ok=clk(f'#numberGrid .cell[data-n="{n}"]')
            if not ok: print('   tap fail',n)
        print('  after: kept=',J('Game.keptCount'),'matchCount=',J('Game.matchCount'),
              'alive=',J('Object.keys(Game.alive).length'),'solved=',J('Game.solved'))
        if J('Game.solved'): break
    wait(1600)
    print('overlay hidden?', J("document.getElementById('overlay').classList.contains('hidden')"))
    print('ovTitle', J("document.getElementById('ovTitle').textContent"))
    print('errors', errs[:5])
    b.close()
