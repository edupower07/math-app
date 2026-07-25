#!/usr/bin/env python3
"""BGM とナレーション音声を動画用に整える。

BGM は「曲の終わり方を活かして90秒ちょうどに収める」ことを優先している。
提供された曲は 84.6秒で、79.6秒あたりから自前でフェードアウトして終わる。
そのまま頭から流すと締めの8秒が無音になり、ループさせると継ぎ目が出る。
そこで **テンポだけを 6% 緩めて（音程は保つ）90秒に合わせる**。
6% の緩みは背景で鳴る音楽ではまず気づかれない。

    python3 scripts/build-audio.py bgm <入力ファイル>
    python3 scripts/build-audio.py vo  <入力ファイル> [出力名]
"""
import subprocess
import sys
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[1] / "public"
AUDIO = PUBLIC / "audio"
TARGET_SEC = 90.0

# 音量の設計：BGM は床、ナレーションはその上。
# ここを揃えておかないと、あとから声を足したときに音楽に埋もれる。
BGM_LUFS = -20      # 実測 -19.2 に落ち着く
VO_LUFS = -16       # BGM より 4LU 上。さらに Remotion 側でダッキングする
TRUE_PEAK = -1.5


def ffmpeg() -> str:
    try:
        import imageio_ffmpeg
    except ImportError:
        sys.exit("pip install imageio-ffmpeg してください")
    return imageio_ffmpeg.get_ffmpeg_exe()


def duration_of(path: Path) -> float:
    out = subprocess.run(
        [ffmpeg(), "-i", str(path)], capture_output=True, text=True
    ).stderr
    for line in out.splitlines():
        if "Duration:" in line:
            hms = line.split("Duration:")[1].split(",")[0].strip()
            h, m, sec = hms.split(":")
            return int(h) * 3600 + int(m) * 60 + float(sec)
    sys.exit(f"尺を読めませんでした: {path}")


def run(args: list[str]) -> None:
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr[-1500:])


def audible_end(path: Path) -> float:
    """曲が実際に鳴り終わる時刻。末尾の無音は尺に数えない。

    ここを見落とすと「無音ごと引き伸ばす」ことになり、動画の締めが
    そのぶん無音になる（一度これをやった）。
    """
    r = subprocess.run(
        [ffmpeg(), "-i", str(path), "-af",
         "silencedetect=noise=-50dB:d=0.5", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    total = duration_of(path)
    starts = [
        float(line.split("silence_start:")[1].strip())
        for line in r.stderr.splitlines() if "silence_start:" in line
    ]
    # 末尾まで続く無音があれば、その開始時刻が実質の終わり
    for st in reversed(starts):
        if total - st > 0.4:
            return st
    return total


def build_bgm(src: Path) -> None:
    raw = duration_of(src)
    dur = audible_end(src)
    if dur < raw - 0.05:
        print(f"末尾の無音 {raw - dur:.2f}s を除外（{raw:.2f}s -> {dur:.2f}s）")
    tempo = dur / TARGET_SEC
    if not 0.5 <= tempo <= 2.0:
        sys.exit(
            f"元の尺 {dur:.1f}s は 90秒 と離れすぎています（tempo={tempo:.3f}）。"
            "テンポ調整ではなくループや別素材を検討してください。"
        )
    AUDIO.mkdir(parents=True, exist_ok=True)
    dst = AUDIO / "bgm.mp3"
    print(f"BGM {dur:.2f}s -> {TARGET_SEC}s (atempo={tempo:.5f}, "
          f"{(1 - tempo) * 100:.1f}% ゆっくり)")
    run([
        ffmpeg(), "-y", "-v", "error", "-i", str(src), "-vn",
        "-t", f"{dur:.3f}",  # 無音を含めずに引き伸ばす
        "-af", f"atempo={tempo:.5f},loudnorm=I={BGM_LUFS}:TP={TRUE_PEAK}:LRA=11,apad",
        "-t", str(TARGET_SEC), "-ar", "48000", "-ac", "2",
        "-c:a", "libmp3lame", "-b:a", "192k", str(dst),
    ])
    print("->", dst)


def build_vo(src: Path, name: str | None) -> None:
    """ナレーション1本を整える。尺はいじらない（喋りは伸縮させない）。"""
    out_dir = AUDIO / "vo"
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / (name or (src.stem + ".mp3"))
    print(f"VO {duration_of(src):.2f}s -> {dst.name}")
    run([
        ffmpeg(), "-y", "-v", "error", "-i", str(src), "-vn",
        "-af", f"loudnorm=I={VO_LUFS}:TP={TRUE_PEAK}:LRA=9",
        "-ar", "48000", "-ac", "2",
        "-c:a", "libmp3lame", "-b:a", "160k", str(dst),
    ])
    print("->", dst)


def main() -> None:
    if len(sys.argv) < 3 or sys.argv[1] not in {"bgm", "vo"}:
        sys.exit(__doc__)
    src = Path(sys.argv[2])
    if not src.exists():
        sys.exit(f"入力が見つかりません: {src}")
    if sys.argv[1] == "bgm":
        build_bgm(src)
    else:
        build_vo(src, sys.argv[3] if len(sys.argv) > 3 else None)


if __name__ == "__main__":
    main()
