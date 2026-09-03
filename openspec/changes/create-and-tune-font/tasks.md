## 1. Spec artifacts

- [x] 1.1 Write Gherkin features under `features/` that copy every create-and-tune OpenSpec scenario (library templates, create dashboard, width, slant, bdd suite) and verify the `.feature` wording matches `specs/create-and-tune/spec.md`
- [x] 1.2 Publish Matt Pocock spec to `.scratch/create-and-tune-font.md` and verify it names the browser as the BDD seam

## 2. BDD runner

- [x] 2.1 Add Playwright + playwright-bdd, Chromium-only config, and `pnpm test:bdd`; verify `pnpm test:bdd` runs (may be red until steps exist)
- [x] 2.2 Implement step definitions at the browser seam (visible copy, `#/library/home`, `#familyName-Input`, `.slider-title` / `.slider-text-controller`, `.prototypo-word`) and verify they map 1:1 to the feature steps
- [x] 2.3 Wire a CI `bdd` job that installs Chromium, starts the app, and runs `pnpm test:bdd`; verify `.github/workflows/ci.yml` includes that job

## 3. Product path

- [x] 3.1 Drive the library → Grotesk create → onboarding → dashboard path until the Create-opens-the-dashboard scenario is green
- [x] 3.2 Make Width and Slant numeric controls apply without wiping the word preview; verify those two scenarios pass
- [x] 3.3 Keep existing unit seams green: `pnpm test:unit` (Formula, control inits, local-api)

## 4. Demo and verify

- [x] 4.1 Storyboard beats covering library (all five names in frame), create TuneMe, dashboard, width, slant
- [x] 4.2 Record the demo and extract frames; write `verify-report.md` with every beat `pass`
