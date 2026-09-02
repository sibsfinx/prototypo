Feature: Create and tune a font
  Designers pick a bundled template as a base, create a named family, and tune Width and Slant in the dashboard.

  Scenario: Library shows templates
    When a user with a local session opens "#/library/home"
    Then Spectral, Antique Gothic, Prototypo Elzevir, Prototypo Grotesk, and Prototypo Fell are visible without scrolling them out of the proof

  Scenario: Create opens the dashboard
    When the user creates a project from Prototypo Grotesk with family name TuneMe
    Then the dashboard shows TuneMe, a glyph canvas, the word preview, and the left-rail sliders

  Scenario: Width slider changes the preview
    When the user sets the Width slider to a value other than its starting value
    Then the Width control shows the new value and the word preview remains visible

  Scenario: Slant slider changes the preview
    When the user sets the Slant slider to a value other than its starting value
    Then the Slant control shows the new value and the word preview remains visible
