#!/usr/bin/env bash
# Extract one proof frame per storyboard beat from a demo MP4.
# Storyboard: markdown table rows `| beat | screen | action | proof | spec-scenario | duration_s |`
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "usage: extract-frames.sh <mp4> <storyboard.md> <out-dir>" >&2
  exit 2
fi

mp4=$1
storyboard=$2
out=$3
mkdir -p "$out"

if ! command -v ffprobe >/dev/null || ! command -v ffmpeg >/dev/null; then
  echo "ffmpeg/ffprobe required" >&2
  exit 1
fi

duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$mp4")
echo "duration_s=$duration"

python3 - "$mp4" "$storyboard" "$out" "$duration" <<'PY'
import csv, re, subprocess, sys
from pathlib import Path

mp4, storyboard, out, duration = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]), float(sys.argv[4])
rows = []
for line in storyboard.read_text().splitlines():
    if not line.strip().startswith("|"):
        continue
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cells) < 6 or cells[0].lower() in {"beat", "----", "---"} or set(cells[0]) <= {"-"}:
        continue
    if re.match(r"^-+$", cells[0].replace(" ", "")):
        continue
    try:
        dur = float(cells[5])
    except ValueError:
        continue
    rows.append({"beat": cells[0], "screen": cells[1], "proof": cells[3], "spec": cells[4], "duration": dur})

t = 0.0
manifest = out / "manifest.csv"
with manifest.open("w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["beat", "t_proof", "file", "screen", "proof", "spec_scenario"])
    w.writeheader()
    for i, row in enumerate(rows, 1):
        t_end = min(t + row["duration"], duration)
        # settle 0.4s before beat end so the proof is on screen
        t_proof = max(t + 0.2, t_end - 0.4)
        t_proof = min(t_proof, max(0.0, duration - 0.05))
        slug = re.sub(r"[^a-z0-9]+", "-", row["beat"].lower()).strip("-") or f"beat-{i:02d}"
        dest = out / f"{i:02d}-{slug}.jpg"
        subprocess.run(
            ["ffmpeg", "-y", "-ss", f"{t_proof:.2f}", "-i", mp4, "-frames:v", "1", "-q:v", "3", str(dest)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        w.writerow({
            "beat": row["beat"],
            "t_proof": f"{t_proof:.2f}",
            "file": str(dest),
            "screen": row["screen"],
            "proof": row["proof"],
            "spec_scenario": row["spec"],
        })
        print(f"{i:02d} t_proof={t_proof:.2f}s -> {dest.name} | {row['beat']}")
        t = t_end
print(f"wrote {manifest}")
PY
