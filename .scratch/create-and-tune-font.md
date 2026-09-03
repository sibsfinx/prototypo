## Problem Statement

A designer needs to pick a bundled template as a base font, create a named family, and tune it in the editor. That path worked in a one-shot demo, but nothing in CI executes the OpenSpec scenarios, so the product can drift from the requirements.

## Solution

Keep the local-first create-and-tune path working, and run the same OpenSpec scenarios as Gherkin against Chromium on every CI build.

## User Stories

1. As a designer, I want to see Spectral, Antique Gothic, Elzevir, Grotesk, and Fell in the library, so that I can pick a base font.
2. As a designer, I want to create a named family from Prototypo Grotesk, so that I have a project to edit.
3. As a designer, I want onboarding to finish on the dashboard, so that I can see the glyph canvas, word preview, and sliders.
4. As a designer, I want the Width slider to change the live font, so that I can tune proportions.
5. As a designer, I want the Slant slider to change the live font, so that I can add italic lean.
6. As a designer, I want the word preview to stay on screen after a slider change, so that a NaN/OTS crash cannot silently blank the editor.
7. As a maintainer, I want Gherkin features that match the OpenSpec scenarios, so that CI fails when the journey breaks.
8. As a maintainer, I want those features to run in the browser, not against Flux internals, so that refactors of stores do not false-fail the suite.
9. As a maintainer, I want unit seams (Formula, control inits, local-api) to keep passing, so that construction math does not regress while BDD covers the UI.
10. As a maintainer, I want a demo whose library beat shows all five templates, so that frame verify is not partial.

## Implementation Decisions

- Gherkin `.feature` files under `features/` copy OpenSpec WHEN/THEN 1:1.
- Playwright Test plus playwright-bdd is the runner. Cucumber.js is not added. Nightwatch is not revived.
- BDD seam is the running Vite app in Chromium. Steps click visible copy and assert visible controls.
- Onboarding is walked for real; Skip is not used.
- Slider proof: type a known value into the numeric Width/Slant control; assert the control and `.prototypo-word` stay visible.
- CI job starts the app and runs `pnpm test:bdd`.

## Testing Decisions

A good test asserts what a designer can see: template names, Create from this template, family name TuneMe, Width/Slant values, word preview. It does not read `prototypo-local-db` or dispatch Flux actions.

Seams:
- Browser (new, this change): `pnpm test:bdd`
- Formula `getResult`, FontPrecursor control inits, local-api session/createFamily (existing): `pnpm test:unit`

Prior art: `__tests__/unit/*.test.mjs` with `node --test`. Nightwatch under `test/` is Graphcool-era and is not the prior art to extend.

## Out of Scope

Graphcool, Stripe, OAuth, Academy courses, remote merge, multi-device sync, every slider, export, pixel-diff of glyph outlines in CI.

## Further Notes

Spec of record: `openspec/changes/create-and-tune-font/`. Sibling change `local-first-font-editor` already delivered the local session; this change gates the designer journey.
