---
name: archestra-apply
description: "Archestra-apply: plan → build → test → demo-record → verify-per-frames-and-spec. Use when applying an OpenSpec change, implementing a feature end-to-end, recording a product demo, or checking video frames against OpenSpec scenarios."
---

# Archestra-apply

End-to-end apply loop. OpenSpec is the spec of record. Matt Pocock skills are the engineering discipline. This skill is the sequence that binds them to a recorded, frame-checked demo.

Do not skip a phase. A later phase that would fail is a stop, not a note.

## Phases

### 1. Plan

1. Read `CONTEXT.md`, `docs/adr/`, and `openspec/config.yaml`.
2. If no OpenSpec change exists for this work, run `/opsx-propose` (skill `openspec-propose`) and create every artifact the schema requires.
3. Synthesize a Matt Pocock spec into `.scratch/<change-name>.md` using the `to-spec` template. Publish a GitHub issue only when `gh` can write; otherwise the scratch file is the published spec.
4. Write `openspec/changes/<change>/demo-storyboard.md`: one beat per observable scenario. Columns: `beat | screen | action | proof | spec-scenario | duration_s`.
5. Plan is done when `openspec status --change <name>` reports planning complete and the storyboard has a beat for every user-visible scenario.

### 2. Build

1. Run `/opsx-apply` (skill `openspec-apply-change`).
2. At each pre-agreed seam, use `tdd` (red → green, one slice).
3. After the last task, run `code-review` against the merge-base of this branch, using the OpenSpec change as the spec source.
4. Mark tasks `- [x]` only when the specified behavior is fully present.

### 3. Test

1. Run the unit seam tests: `pnpm test:unit`.
2. If a browser/dev-server path is in scope, start `pnpm start` and hit the routes the storyboard names.
3. A red test or a broken route is a build defect: go back to Build. Do not record a demo of a failing product.

### 4. Demo-record

Storyboard is the gate. No storyboard, no capture.

1. Put the app on the first beat's screen (setup is off-camera).
2. `RecordScreen` `START_RECORDING`.
3. Drive the storyboard beats in order with the computer-use agent. Pause on each **proof** until it is visible.
4. `RecordScreen` `SAVE_RECORDING` with a filename that names the whole journey.
5. If the take misses a beat, discard and recapture. Do not salvage a bad take with extra clips.

### 5. Verify-per-frames-and-spec

The MP4 is the arbiter, not the planned clock.

1. `ffprobe` the saved MP4 for duration.
2. Run `scripts/extract-frames.sh <mp4> <storyboard.md> <out-dir>` (this skill's `scripts/`). It writes one JPEG per beat at `t_proof` (cumulative duration minus a short settle, never t=0 for a result beat).
3. For each beat, read the JPEG and check it against that beat's **proof** and the named OpenSpec scenario (`WHEN`/`THEN`). Fail the beat if the frame does not show the claim.
4. Dispatch `videoReview` on the MP4 with the storyboard as the expected journey. Treat a timeout as unverified, not as a pass.
5. Write `openspec/changes/<change>/verify-report.md`: per-beat `pass`/`fail`/`unverified`, the frame path, and the spec scenario cited.

Verify is done when every storyboard beat is `pass`. Any `fail` returns to Build or Demo-record. `unverified` is not done.

## Seams for this repo

Default test seams (override only in the change's Testing Decisions):

- **Formula**: missing or NaN params become `0`.
- **FontPrecursor**: `controls[].parameters[].init` merge into `constructFont`.
- **local-api**: `ensureLocalSession` + `createFamily` persist in `localStorage`.

## Commands

OpenSpec CLI: `openspec` if on `PATH`, else `npx --yes @fission-ai/openspec@latest`. Cloud agent prefix: `$HOME/.npm-global/bin`.
