#!/usr/bin/env python3
"""v4（Remotion・90秒）用の素材を撮る。

v3 との違いは2つ。

1. **テロップを焼き込まない。** director.js のうち収録時にしかできない
   ズーム・カーソル・クリック波紋・リングだけを使い、テロップ／チップ／
   カードは一切呼ばない。文字は後段の Remotion で合成する。
   （焼き込むと言い回しを直すたびに録り直しになるため。DESIGN.md §5）

2. **カットごとに別ファイルで撮る。** 1本の長回しだと編集で秒数を
   調整するたびに全体のフレーム位置がずれる。Remotion 側で
   <OffthreadVideo> を並べられるよう、絵コンテの1カット＝1ファイルにする。

    pip install playwright imageio-ffmpeg
    python3 tools/video/recorder_v4.py            # 全カット
    python3 tools/video/recorder_v4.py s06 s09    # 指定カットだけ撮り直し

出力: tools/video/remotion/public/footage/<id>.mp4（30fps固定）

Playwright は webm(VP8) しか吐けず、しかもフレーム間隔が一定でない。
Remotion でフレーム単位に扱うため 30fps の mp4 に正規化する。
なお **Playwright 同梱の ffmpeg は使えない**（VP8専用ビルドで libx264 が無い）。
imageio-ffmpeg が持ってくる完全版を使うこと。
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src"
PUBLIC = ROOT / "tools/video/remotion/public"
FOOTAGE = PUBLIC / "footage"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
DIRJS = (Path(__file__).parent / "director.js").read_text(encoding="utf-8")
W, H = 1920, 1080

# DESIGN.md §4「収録に使う事件」。犯人=24 に一意に絞れることを検算済み。
# 奇数を使うと 24（偶数）が消えて破綻するので変更するときは要検算。
CASE = """
  APP.badges=10; APP.solved=10; APP.levelMode=false; Settings.applyPhase(3);
  Game.setup({secret:24, range:50, hints:[
    Engine.makeHint({category:'parity', parity:'even'}),
    Engine.makeHint({category:'multiple', k:6}),
    Engine.makeHint({category:'basic', kind:'ones', d:4})
  ]}, 50, 'FILE No.002 事件：この現場に「ひみつの数」が ひとり かくれている。');
"""


def build_preview() -> Path:
    """GAS の include を展開し、フォントをローカル参照にした単体HTMLを作る。"""
    idx = (SRC / "index.html").read_text(encoding="utf-8")
    fonts_css = PUBLIC / "fonts" / "fonts.css"
    if not fonts_css.exists():
        sys.exit("先に tools/video/remotion/scripts/fetch-fonts.py を実行してください")
    fonts = fonts_css.read_text(encoding="utf-8").replace(
        "url(/fonts/", f"url({PUBLIC.as_uri()}/fonts/"
    )
    idx = idx.replace(
        "<?!= include('styles'); ?>",
        f"<style>{fonts}</style>\n{(SRC / 'styles.html').read_text(encoding='utf-8')}",
    )
    idx = idx.replace(
        "<?!= include('app'); ?>", (SRC / "app.html").read_text(encoding="utf-8")
    )
    # Chromium は HTTPS_PROXY を読まないので Google Fonts は直接引けない
    idx = re.sub(r'<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>', "", idx)
    out = Path(tempfile.gettempdir()) / "kazu_preview_v4.html"
    out.write_text(idx, encoding="utf-8")
    return out


def ffmpeg_exe() -> str:
    """完全版の ffmpeg を返す。Playwright 同梱のものは libx264 を持たない。"""
    try:
        import imageio_ffmpeg
    except ImportError:
        sys.exit("pip install imageio-ffmpeg してください")
    return imageio_ffmpeg.get_ffmpeg_exe()


def to_mp4(src: Path, dst: Path) -> None:
    """可変フレームレートの webm を 30fps 固定の mp4 に変換する。"""
    r = subprocess.run(
        [ffmpeg_exe(), "-y", "-i", str(src), "-r", "30",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-an", str(dst)],
        capture_output=True, text=True,
    )
    if r.returncode != 0 or not dst.exists():
        sys.exit(f"mp4 変換に失敗しました:\n{r.stderr[-1500:]}")


class Stage:
    """1カット分のページ操作。テロップ系は意図的に生やしていない。"""

    def __init__(self, page):
        self.pg = page

    # --- 基本 ---
    def js(self, s):
        return self.pg.evaluate(s)

    def wait(self, ms):
        self.pg.wait_for_timeout(ms)

    # --- カメラ（収録時にしかできない仕事） ---
    def zin(self, sel, pad=0.05, dur=0.85, settle=260):
        ok = self.js(f"DIR.zoom({json.dumps(sel)},{pad},{dur})")
        self.wait(int(dur * 1000) + settle)
        return ok

    def zout(self, dur=0.7, settle=240):
        self.js(f"DIR.reset({dur})")
        self.wait(int(dur * 1000) + settle)

    def ring(self, sel):
        self.js(f"DIR.ring({json.dumps(sel)})")

    def ringoff(self):
        self.js("DIR.ringOff()")

    # --- 操作 ---
    def _onscreen(self, b, m=8):
        return b and b["w"] > 0 and m < b["x"] < W - m and m < b["y"] < H - m

    def click(self, sel, move=450, after=260, quiet=False):
        """カーソルを動かし、直前に座標を再計測してから実クリック。
        対象が画面外ならズームを戻してから押す（空振り防止）。"""
        b1 = self.js(f"DIR.at({json.dumps(sel)})")
        if not self._onscreen(b1):
            self.js("DIR.reset(0.55)")
            self.wait(760)
            b1 = self.js(f"DIR.at({json.dumps(sel)})")
        if not b1:
            if not quiet:
                print("  MISS(no el):", sel, flush=True)
            return False
        self.js(f"DIR.cursor({b1['x']},{b1['y']},{move})")
        self.wait(move + 70)
        b2 = self.js(f"DIR.at({json.dumps(sel)})") or b1
        self.js(f"DIR.pulse({b2['x']},{b2['y']})")
        self.pg.mouse.click(b2["x"], b2["y"])
        self.wait(after)
        return True

    def cell(self, n):
        return f'#numberGrid .cell[data-n="{n}"]'

    def reveal(self, show=True):
        self.pg.wait_for_function(
            "()=>{const b=document.getElementById('revealBtn');"
            "return b&&!b.disabled&&!Game.selecting;}",
            timeout=4000,
        )
        if show:
            self.zin(".clue-area", 0.05, 0.75)
        return self.click("#revealBtn", move=420, after=780)

    def to_grid(self):
        self.zin(".grid-wrap", 0.03, 0.8)

    def tap_matching(self, slow_n=4, slow=235, fast=100):
        """合う数を1つずつタップする。取りこぼしは最大3回まで自動で回収。"""
        for i, n in enumerate(self.js("Game.matchList.slice()")):
            if i < slow_n:
                self.click(self.cell(n), move=slow, after=150, quiet=True)
            else:
                self.click(self.cell(n), move=fast, after=65, quiet=True)
        for _ in range(3):
            rest = self.js("Game.selecting ? Game.matchList.filter(n=>!Game.kept[n]) : []")
            if not rest:
                break
            print("  retap", rest, flush=True)
            for n in rest:
                self.click(self.cell(n), move=90, after=70, quiet=True)

    def wait_solved(self, t=5000):
        try:
            self.pg.wait_for_function("()=>Game.solved", timeout=t)
            return True
        except Exception:
            print("  NOT SOLVED", flush=True)
            return False

    def wait_overlay(self, t=5000):
        try:
            self.pg.wait_for_function(
                "()=>!document.getElementById('overlay').classList.contains('hidden')",
                timeout=t,
            )
            return True
        except Exception:
            return False

    def close_overlay(self):
        if self.js("!document.getElementById('overlay').classList.contains('hidden')"):
            self.click(".overlay-card .big-btn", move=360, after=500)
            self.js("UI.closeOverlay()")

    def nav(self, sel, screen, move=560):
        self.click(sel, move=move, after=650)
        ok = self.js(f"document.getElementById('screen-{screen}').classList.contains('active')")
        if not ok:
            self.click(sel, move=220, after=650)
        return ok

    def to_home(self):
        self.zout(0.5)
        self.click(".screen.active .page-head .back", move=500, after=650)


# ======================================================================
#  カット定義。id は DESIGN.md §4 の通し番号に対応する。
# ======================================================================

# --- 捜査コア（#4〜#8）：収録ではズームしない ---------------------------
# フレーミングを焼き付けないため。素の 1920×1080 で撮り、Remotion 側で
# 現場パネル（504,125.5 / 912×709.5）を切り出して机の上に置く。
# 切り出し 912px → 配置 940px なので拡大は1.03倍、画質は実質そのまま。
# 寄り・引きを後から変えられるので、尺の調整で絵が破綻しない。

def s04_open(st: Stage):
    """#4 現場が置かれる。容ぎ者50人の全景。"""
    st.js(CASE)
    st.wait(2600)


def s05_clue1(st: Stage):
    """#5 手がかりを調べる → 証拠①（偶数）"""
    st.js(CASE)
    st.wait(300)
    st.reveal(show=False)
    st.wait(1600)


def s06_tap1(st: Stage):
    """#6 偶数のマスを自分でタップ 50 → 25"""
    st.js(CASE)
    st.wait(300)
    st.reveal(show=False)
    st.wait(500)
    st.tap_matching(slow_n=6, slow=250)
    st.wait(1100)


def s07_tap2(st: Stage):
    """#7 証拠②（6の倍数）→ 25 → 8"""
    st.js(CASE)
    st.wait(300)
    st.reveal(show=False)
    st.tap_matching(slow_n=0, slow=90, fast=60)
    st.wait(300)
    st.reveal(show=False)
    st.wait(900)
    st.tap_matching(slow_n=4)
    st.wait(1000)


def s08_tap3(st: Stage):
    """#8 証拠③（一の位は4）→ 8 → 1"""
    st.js(CASE)
    st.wait(300)
    for _ in range(2):
        st.reveal(show=False)
        st.tap_matching(slow_n=0, slow=90, fast=60)
    st.wait(300)
    st.reveal(show=False)
    st.wait(900)
    st.tap_matching(slow_n=2)
    st.wait(900)


# --- 寄りのカット：ここは収録時にズームする -----------------------------
# CSS transform でDOMごと拡大するため文字がベクタのまま鮮明。
# 後段で映像を引き伸ばすとボケるので、この2カットだけは収録時に決める。

def s09_solved(st: Stage):
    """#9 スポットライト＋解決。犯人24に寄る。"""
    st.js(CASE)
    st.wait(300)
    for _ in range(3):
        st.reveal(show=False)
        st.tap_matching(slow_n=0, slow=80, fast=55)
    st.wait_solved()
    st.wait(300)
    st.zin(st.cell(24), 3.0, 0.9)
    st.ring(st.cell(24))
    st.wait(2000)
    st.ringoff()
    st.zout(0.7)
    st.wait_overlay()
    st.wait(300)
    st.zin(".overlay-card", 0.32, 0.8)
    st.wait(4000)  # 決めの画は長めに持たせる（編集で切り出す余裕をつくる）


def s11_rankup(st: Stage):
    """#11 探偵ランクUP → 解禁マップ"""
    st.js("APP.badges=14; APP.solved=14; UI.refreshRankChip();")
    st.js(CASE)
    st.wait(300)
    for _ in range(3):
        st.reveal(show=False)
        st.tap_matching(slow_n=0, slow=80, fast=55)
    st.wait_solved()
    st.zout(0.6)
    st.wait_overlay()
    st.wait(950)  # 解決モーダル→昇格モーダルへの差し替えを待つ
    st.zin(".overlay-card", 0.32, 0.75)
    st.wait(1500)
    st.close_overlay()
    st.zout(0.6)
    st.to_home()
    st.nav(".folder.c-dex", "dex")
    st.zin(".dex-map", 0.03, 0.9)
    st.wait(6500)  # 解禁マップが主題。6秒のカットに使えるだけ持たせる


def s12_highlight(st: Stage):
    """#12 重ねて分析：公倍数を色で重ねる"""
    st.nav(".folder.c-highlight", "highlight")
    st.js("document.getElementById('hlA').value=6; document.getElementById('hlB').value=8;")
    st.zin("#screen-highlight .case-paper", 0.02, 0.72)
    st.click(".hl-inputs .big-btn", move=480, after=900)
    st.wait(2500)
    st.zin("#hlQuestion", 0.10, 0.8)
    st.wait(4000)


def s13_create(st: Stage):
    """#13 挑戦状づくり：容ぎ者数がリアルタイムに変わる"""
    st.nav(".folder.c-create", "create")
    st.zin("#addHintRow", 0.16, 0.72)
    st.wait(300)
    for sel in ["#addHintRow .add-chip:nth-child(4)", "#addHintRow .add-chip:nth-child(5)"]:
        st.click(sel, move=440, after=750, quiet=True)
    # click() は対象が画面外だと空振り防止でズームを戻す。そのままだと
    # 引いた絵で終わってしまうので、決めの画に寄り直してから持たせる。
    st.zin(".create-wrap", 0.10, 0.75)
    st.wait(4500)


def s14_group(st: Stage):
    """#14 グループ対決のスコアボード"""
    st.nav(".folder.c-group", "group")
    st.zin("#screen-group .case-paper", 0.02, 0.75)
    st.wait(5000)


SCENES = {
    "s04": s04_open,
    "s05": s05_clue1,
    "s06": s06_tap1,
    "s07": s07_tap2,
    "s08": s08_tap3,
    "s09": s09_solved,
    "s11": s11_rankup,
    "s12": s12_highlight,
    "s13": s13_create,
    "s14": s14_group,
}

# 捜査画面から始めるカット（メニューを経由しないもの）
STARTS_IN_GAME = {"s04", "s05", "s06", "s07", "s08", "s09", "s11"}


def record(browser, preview: Path, scene_id: str) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix=f"rec_{scene_id}_"))
    ctx = browser.new_context(
        viewport={"width": W, "height": H},
        record_video_dir=str(tmp),
        record_video_size={"width": W, "height": H},
    )
    page = ctx.new_page()
    page.goto(preview.as_uri())
    page.wait_for_timeout(1100)
    page.evaluate("try{HowTo.close()}catch(e){}")
    page.evaluate(DIRJS)
    page.evaluate("DIR.init(); DIR.hideUI(true)")  # ブランド章・チップは出さない
    page.wait_for_timeout(250)

    st = Stage(page)
    if scene_id in STARTS_IN_GAME:
        st.js("try{Nav.go('game')}catch(e){}")
        st.wait(700)

    SCENES[scene_id](st)
    st.wait(300)

    ctx.close()  # ここで webm が書き出される
    src = next(tmp.glob("*.webm"))
    FOOTAGE.mkdir(parents=True, exist_ok=True)
    dst = FOOTAGE / f"{scene_id}.mp4"
    to_mp4(src, dst)
    shutil.rmtree(tmp, ignore_errors=True)
    return dst


def main():
    wanted = [a for a in sys.argv[1:] if a in SCENES] or list(SCENES)
    preview = build_preview()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=CHROME,
            args=["--force-device-scale-factor=1", "--hide-scrollbars"],
        )
        for scene_id in wanted:
            print(f"--- {scene_id} {SCENES[scene_id].__doc__.splitlines()[0]}", flush=True)
            out = record(browser, preview, scene_id)
            size = out.stat().st_size // 1024
            print(f"    -> {out.name}  {size} KB", flush=True)
        browser.close()

    print("\n収録した素材:", FOOTAGE)
    for f in sorted(FOOTAGE.glob("*.mp4")):
        print(" ", f.name, f.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
