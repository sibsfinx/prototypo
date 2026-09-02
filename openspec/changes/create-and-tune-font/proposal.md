## Why

Designers must pick a bundled template (base font), create a named family, and tune it with dashboard sliders. Unit tests and a one-shot demo do not keep that journey honest: OpenSpec scenarios can drift from the running app. We need the product path itself, plus executable Gherkin that CI runs against Chromium.

## What Changes

- Lock the user-visible **create-and-tune** journey: library templates → create from a base → onboarding name → dashboard → Width/Slant update the live font.
- Add **Gherkin features** that copy those OpenSpec scenarios and run them with Playwright against `pnpm start`.
- Wire `pnpm test:bdd` into CI so a broken create/tune path fails the build.
- Fix any product gap the scenarios expose (blank canvas, missing sliders, create blocked).

## Capabilities

### New Capabilities

- `create-and-tune`: pick a template, create a family, reach the dashboard, and adjust Width and Slant so the preview stays live

### Modified Capabilities

<!-- none in openspec/specs/ — sibling change local-first-font-editor is not archived -->

## Impact

Library create → onboarding → dashboard sliders. New `features/` + Playwright BDD runner. CI job after unit tests. No Graphcool, Stripe, OAuth, or remote merge.
