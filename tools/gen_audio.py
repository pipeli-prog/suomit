#!/usr/bin/env python3
"""Generate neural Finnish clips for SuomiT with edge-tts (fi-FI-NooraNeural).

Reads tools/speech-strings.json (from `node tools/harvest.mjs`), writes
audio/<h[:2]>/<h>.mp3 where h = first 12 hex chars of SHA-1(normalized UTF-8 text),
and data/audio-index.js listing every clip on disk that is still in the string list.
Re-runnable: existing files are skipped.

Usage (from the repo root):  <venv>/bin/python tools/gen_audio.py [--limit N] [--concurrency 10] [--prune]
"""
import argparse
import asyncio
import hashlib
import json
import random
import re
import shutil
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
VOICE = "fi-FI-NooraNeural"
FFMPEG = shutil.which("ffmpeg")
TAIL = 0.15  # seconds of silence kept after the last sound


def norm(text: str) -> str:
    # Must match js/audio.js and tools/harvest.mjs: text.trim().replace(/\s+/g, ' ')
    return re.sub(r"\s+", " ", text.strip())


def clip_hash(text: str) -> str:
    return hashlib.sha1(norm(text).encode("utf-8")).hexdigest()[:12]


def clip_path(h: str) -> Path:
    return ROOT / "audio" / h[:2] / f"{h}.mp3"


def tts_text(text: str) -> str:
    # Same cleanup the speechSynthesis path does: "..." is a pause, not "piste piste piste".
    return text.replace("...", " ").replace("…", " ").strip()


async def run(*cmd: str) -> str:
    p = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    out, err = await p.communicate()
    if p.returncode:
        raise RuntimeError(f"{cmd[0]} failed: {err.decode(errors='replace')[-300:]}")
    return err.decode(errors="replace")


async def trim_tail(src: Path, dst: Path) -> None:
    """Drop edge-tts's ~0.8 s trailing silence losslessly (cut at an MP3 frame, no re-encode).
    Makes clips smaller and lets read-aloud move to the next sentence without a long gap."""
    log = await run(FFMPEG, "-hide_banner", "-nostats", "-i", str(src), "-af", "silencedetect=n=-50dB:d=0.25", "-f", "null", "-")
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", log)
    starts = re.findall(r"silence_start: ([\d.]+)", log)
    ends = re.findall(r"silence_end: ([\d.]+)", log)
    total = int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3]) if dur else 0
    # trailing silence = a silence_start with no matching silence_end, or one that ends at EOF
    cut = None
    if starts and (len(starts) > len(ends) or float(ends[-1]) >= total - 0.05):
        cut = float(starts[-1]) + TAIL
    if not cut or cut < 0.3 or cut >= total - 0.05:
        src.replace(dst)
        return
    await run(FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-t", f"{cut:.3f}", "-c", "copy", "-map_metadata", "-1", "-id3v2_version", "0", "-f", "mp3", str(dst))
    src.unlink()


async def synth(text: str, out: Path, retries: int = 5) -> None:
    tmp = out.with_suffix(".part")
    for attempt in range(retries):
        try:
            await edge_tts.Communicate(tts_text(text), VOICE).save(str(tmp))
            if tmp.stat().st_size < 500:
                raise RuntimeError(f"suspiciously small clip ({tmp.stat().st_size} B)")
            if FFMPEG:
                await trim_tail(tmp, out)
            else:
                tmp.replace(out)
            return
        except Exception:  # network hiccups, throttling, NoAudioReceived
            if tmp.exists():
                tmp.unlink()
            if attempt == retries - 1:
                raise
            await asyncio.sleep(min(30, 1.5 * 2 ** attempt) + random.random())


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="only the first N strings (testing)")
    ap.add_argument("--concurrency", type=int, default=10)
    ap.add_argument("--prune", action="store_true", help="delete clips that are no longer in the string list")
    a = ap.parse_args()

    data = json.loads((ROOT / "tools" / "speech-strings.json").read_text("utf-8"))
    strings = data["strings"][: a.limit or None]
    jobs, seen = [], set()
    for t in strings:
        h = clip_hash(t)
        if h in seen:
            continue
        seen.add(h)
        if not clip_path(h).exists():
            jobs.append((t, h))
    if not FFMPEG:
        print("note: ffmpeg not found, clips keep edge-tts's trailing silence")
    print(f"{len(strings)} strings, {len(seen)} unique hashes, {len(seen) - len(jobs)} already on disk, {len(jobs)} to generate")

    sem = asyncio.Semaphore(a.concurrency)
    failed, done = [], 0

    async def job(t: str, h: str) -> None:
        nonlocal done
        async with sem:
            p = clip_path(h)
            p.parent.mkdir(parents=True, exist_ok=True)
            try:
                await synth(t, p)
            except Exception as e:
                failed.append((t, repr(e)))
            done += 1
            if done % 250 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)} ({len(failed)} failed)", flush=True)

    await asyncio.gather(*(job(t, h) for t, h in jobs))

    if a.prune and not a.limit:
        stale = [f for f in (ROOT / "audio").rglob("*.mp3") if f.stem not in seen]
        for f in stale:
            f.unlink()
        print(f"pruned {len(stale)} stale clips")

    # Index = clips that exist on disk AND are in the current string list.
    have = sorted(h for h in seen if clip_path(h).exists())
    body = ",".join(f'"{h}"' for h in have)
    (ROOT / "data" / "audio-index.js").write_text(
        "// Generated by tools/gen_audio.py: hashes of pre-generated clips in audio/. Do not edit.\n"
        f"export const AUDIO = new Set([{body}]);\n",
        "utf-8",
    )
    size = sum(f.stat().st_size for f in (ROOT / "audio").rglob("*.mp3"))
    print(f"index: {len(have)} clips → data/audio-index.js; audio/ total {size / 1e6:.1f} MB")
    if failed:
        print(f"{len(failed)} failed:", file=sys.stderr)
        for t, e in failed[:20]:
            print(f"  {t!r}: {e}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
