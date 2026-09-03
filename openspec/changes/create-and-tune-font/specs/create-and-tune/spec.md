## Purpose

Lets a designer pick a bundled template as a base font, create a named family, and tune Width and Slant in the dashboard editor so the live preview updates.

## ADDED Requirements

### Requirement: Templates listed as bases
The library at `#/library/home` SHALL show all five bundled templates as bases a designer can pick: Spectral, Antique Gothic, Prototypo Elzevir, Prototypo Grotesk, Prototypo Fell.

#### Scenario: Library shows templates
- **WHEN** a user with a local session opens `#/library/home`
- **THEN** Spectral, Antique Gothic, Prototypo Elzevir, Prototypo Grotesk, and Prototypo Fell are visible without scrolling them out of the proof

### Requirement: Create from a picked template
The user SHALL be able to pick Prototypo Grotesk, name a family, complete onboarding, and land on the dashboard editor for that family.

#### Scenario: Create opens the dashboard
- **WHEN** the user creates a project from Prototypo Grotesk with family name TuneMe
- **THEN** the dashboard shows TuneMe, a glyph canvas, the word preview, and the left-rail sliders

### Requirement: Width slider changes the live font
Changing the Width control on the dashboard SHALL rebuild the preview without a blank canvas.

#### Scenario: Width slider changes the preview
- **WHEN** the user sets the Width slider to a value other than its starting value
- **THEN** the Width control shows the new value and the word preview remains visible

### Requirement: Slant slider changes the live font
Changing the Slant control on the dashboard SHALL rebuild the preview without a blank canvas.

#### Scenario: Slant slider changes the preview
- **WHEN** the user sets the Slant slider to a value other than its starting value
- **THEN** the Slant control shows the new value and the word preview remains visible

### Requirement: Gherkin scenarios gate the journey
The scenarios in this spec SHALL exist as Gherkin features under `features/` and SHALL run in CI against the running app. A failed scenario SHALL fail the build.

#### Scenario: BDD suite covers create-and-tune
- **WHEN** `pnpm test:bdd` runs
- **THEN** every scenario in this spec is executed in the browser and all of them pass
