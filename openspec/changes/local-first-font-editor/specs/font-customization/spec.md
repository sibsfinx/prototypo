## ADDED Requirements

### Requirement: Create from template
The user SHALL be able to create a named family from a template and reach the dashboard editor.

#### Scenario: Create opens the dashboard
- **WHEN** the user creates a project from Prototypo Grotesk with a family name
- **THEN** the dashboard shows that family, a glyph canvas, the word preview, and the left-rail sliders

### Requirement: Control inits fill missing slider params
`FontPrecursor` SHALL merge each template control's `init` into the params used by `constructFont` so unspecified sliders are not `undefined`.

#### Scenario: Construct font with empty params uses inits
- **WHEN** a precursor is built from a template whose controls include `thickness` init `80`
- **THEN** `controlInits.thickness` is `80` and that value is present in the merged params for construction

### Requirement: Formula missing params are zero
A Formula SHALL treat a missing or NaN parameter as `0` rather than throwing or propagating NaN into glyph metrics.

#### Scenario: Missing params evaluate as zero
- **WHEN** a formula depends on `thickness` and `slant` and is evaluated with `{}`
- **THEN** the numeric result is `0`

#### Scenario: NaN params evaluate as zero
- **WHEN** a formula is evaluated with `thickness: NaN` and `slant: 5`
- **THEN** the numeric result is `5`

### Requirement: Sliders update the live font
Changing a dashboard slider SHALL rebuild the preview without a blank canvas or an OTS/NaN crash.

#### Scenario: Width slider changes the preview
- **WHEN** the user moves the Width slider on the dashboard
- **THEN** the word preview remains visible and the glyph outlines change

#### Scenario: Slant slider changes the preview
- **WHEN** the user moves the Slant slider on the dashboard
- **THEN** the word preview remains visible and the glyph outlines change
