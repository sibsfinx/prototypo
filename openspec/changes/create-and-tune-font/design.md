## Context

See proposal.md — Why. The local-first editor already boots (`pnpm start` on :9000), lists templates, and can create a family. Proof today is unit seams plus a recorded demo whose library beat was only partial (Spectral scrolled off). Nightwatch e2e still assumes Graphcool login and is not a gate.

## Goals / Non-Goals

**Goals:**
- Keep the pick-template → name family → dashboard → Width/Slant path working.
- Make OpenSpec scenarios executable as Gherkin so CI, not a demo take, is the regression gate.
- Test at the browser seam only for this journey.

**Non-Goals:**
- Restoring Nightwatch, Jest Storyshots, Graphcool, Stripe, Academy, or remote merge.
- Cucumber.js as a second test runner.
- Testing every slider, alternate, or export.

## Decisions

1. **Gherkin features are required.** OpenSpec WHEN/THEN is already Gherkin. Without a runner, the spec is commentary. Feature files under `features/` copy the spec scenarios 1:1 so wording cannot silently diverge.

2. **Playwright Test + playwright-bdd, not Cucumber.js.** One runner, traces, screenshots, CI HTML report. Cucumber.js would add a parallel CLI and duplicate config. Nightwatch stays unused.

3. **Highest seam: Chromium against `pnpm start`.** Do not poke Flux stores or GraphQL from the BDD steps. Assertions use visible copy (template names, Create from this template, family name, slider labels Width/Slant, `.prototypo-word`). Unit seams (Formula, control inits, local-api) stay in `pnpm test:unit`.

4. **Onboarding is in the path.** Skip is hidden until the user already has more than three families. The suite walks name → Start designing → Next… → Finish. Timeouts must cover template/font generation.

5. **Slider proof is the numeric control + visible preview, not pixel-diff of outlines.** Independent expected values: type a known Width/Slant into `.slider-text-controller`. Outlines changing is implied by the control applying without wiping `.prototypo-word`. Pixel diffs are reserved for Archestra-apply demo frames.

6. **CI job `bdd` after unit+build.** Install Chromium, start Vite, run `pnpm test:bdd`. Fail the workflow on a red scenario.

## Risks / Trade-offs

- [Joyride / broken header SVGs overlay the editor] → Steps dismiss overlays (Escape / skip) and click by role/text, not by icon.
- [Onboarding is slow / font compile] → 60s+ waits on dashboard and sliders; one Chromium worker.
- [playwright-bdd generate step] → `pnpm test:bdd` runs codegen then Playwright so features stay source of truth.
- [CI minutes] → Chromium only; no Firefox/WebKit; reuse the Vite process.

## Migration Plan

Add features and runner on this branch. No data migration. Rollback is revert of the BDD job; the editor still runs without it.
