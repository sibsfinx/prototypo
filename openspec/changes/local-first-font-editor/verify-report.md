# Verify report — local-first-font-editor

Take: `/opt/cursor/artifacts/library_create_specapply_customize_width_slant.mp4` (47.6s)
Storyboard: `demo-storyboard.md`
Method: ffmpeg frames at MP4-derived `t_proof` + videoReview of the MP4. Planned waits were not used as the clock.

| beat | t_proof | spec scenario | verdict |
| --- | --- | --- | --- |
| library-templates | 1.90s | font-library / Library shows templates | **partial** |
| create-from-grotesk | 35.60s | font-customization / Create opens the dashboard | **pass** |
| dashboard-editor | 41.60s | font-customization / Create opens the dashboard | **pass** |
| width-slider | 40.50s | font-customization / Width slider changes the preview | **pass** |
| slant-slider | 45.20s | font-customization / Slant slider changes the preview | **pass** |

## Per beat

### library-templates — partial
MP4 0.00–3.25 shows Antique Gothic, Prototypo Elzevir, Prototypo Grotesk, Prototypo Fell. Spectral is scrolled off. Grotesk is selected with **Create from this template**. Still `verify_library_templates.webp` (same session, immediately before capture) shows all five names including Spectral. Capability holds; this take's opening frame does not.

### create-from-grotesk — pass
Click Grotesk → name **SpecApply** (~11s) → full onboarding → Congratulations / Finish (~36s).

### dashboard-editor — pass
`#/dashboard`, header **SPECAPPLY** / Regular, left-rail sliders, live text preview.

### width-slider — pass
Width dragged from `1.00` to about `1.11`. Preview stays on screen and reads wider.

### slant-slider — pass
Slant dragged off `0`. Preview stays on screen and reads slanted. Tail of the MP4 (45.5s–end) is the Prototypo logo; not used as proof.

## Unit tests

`pnpm test:unit` — 8 passed (Formula missing/NaN → 0, control inits, local session / createFamily).

## Open items

- Onboarding intro image is a broken asset (out of spec).
- Recapture with Spectral kept in frame if a strict all-five library shot is required from the MP4 alone.
