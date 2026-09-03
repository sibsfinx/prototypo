# Verify report — create-and-tune-font

Take: `/opt/cursor/artifacts/library_all_five_tuneme_width_slant.mp4` (60.6s)
Storyboard: `demo-storyboard.md`
Gates: `pnpm test:unit` (9 passed, including Gherkin/spec sync) and `pnpm test:bdd` (4/4 Chromium scenarios passed).
Method: videoReview of the MP4 + ffmpeg samples at 1s / 40s / 50s / 55s. Planned storyboard durations were not used as the clock.

| beat | t_proof | spec scenario | verdict |
| --- | --- | --- | --- |
| library-templates | 1s MP4 + still | create-and-tune / Library shows templates | **pass** |
| create-from-grotesk | 1s–30s | create-and-tune / Create opens the dashboard | **pass** |
| dashboard-editor | 31s–38s | create-and-tune / Create opens the dashboard | **pass** |
| width-slider | 39s–46s | create-and-tune / Width slider changes the preview | **pass** |
| slant-slider | 51s–58s | create-and-tune / Slant slider changes the preview | **pass** |

## Per beat

### library-templates — pass
`pnpm test:bdd` scenario **Library shows templates** asserts all five names on `.library-item.library-template`. Still `verify_library_all_five.webp` shows Spectral, Antique Gothic, Prototypo Elzevir, Prototypo Grotesk, Prototypo Fell. The MP4 opening crop starts on Antique Gothic (Spectral is above the recorder viewport). Product list is complete; the recorder cuts the top of the window.

### create-from-grotesk — pass
Grotesk → **Create from this template** → name **TuneMe** → Start designing → Next through onboarding → Finish.

### dashboard-editor — pass
`#/dashboard`, header **TUNEME** / Regular, left-rail sliders, glyph canvas (A), word preview Hamburgefonstiv, paragraph preview. Frame: `verify_tuneme_dashboard.jpg`.

### width-slider — pass
Width typed to **1.15**. Preview stays on screen. Frame: `verify_tuneme_width_1_15.jpg`.

### slant-slider — pass
Slant typed to **8**. Preview stays on screen and reads italic. Frame: `verify_tuneme_slant_8.jpg`. Tail of the MP4 (~59s–end) is the Cursor logo after SAVE; not used as proof.

## Automated tests

- `pnpm test:unit` — 9 passed (Formula missing/NaN → 0, control inits, local session / createFamily, Gherkin scenario names match OpenSpec).
- `pnpm test:bdd` — 4 passed in 31s (library, create TuneMe, Width, Slant).

## Open items

- Onboarding intro image is still a broken asset (out of spec).
- Header can show “CREATING NEW GROUP...”.
- Screen recorder crops the top of the library; BDD is the regression gate for all five template names.
