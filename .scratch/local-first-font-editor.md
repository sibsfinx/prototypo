## Problem Statement

A designer cannot open Prototypo, create a font from a template, or customize it, because Graphcool is gone and the Vite app crashed before the editor loaded.

## Solution

Run local-first: auto local session, templates from `/templates/<name>/font.json`, families in `localStorage`, and precursor/Formula defaults so sliders cannot NaN the font.

## User Stories

1. As a designer, I want the app to open without an account, so that a dead backend cannot block me.
2. As a designer, I want to see Spectral, Antique Gothic, Elzevir, Grotesk, and Fell in the library, so that I can pick a starting point.
3. As a designer, I want to create a named family from a template, so that I have a project to edit.
4. As a designer, I want the dashboard glyph canvas and word preview, so that I can see the font.
5. As a designer, I want Width and Slant sliders to change the live preview, so that I can customize the cut.
6. As a designer, I want my families to persist in this browser, so that reload does not wipe the library.

## Implementation Decisions

- Apollo 1 stays; the network interface calls `executeLocalQuery`.
- Token `local-prototypo-token` in `graphcoolToken`; DB key `prototypo-local-db`.
- Templates copied at start, not bundled via `import.meta.glob`.
- `FontPrecursor` merges control inits; Formula maps missing/NaN params to `0`.
- Merge service skipped unless `MERGE` is set.

## Testing Decisions

Test behavior at three seams only: Formula `getResult`, FontPrecursor `controlInits`, local-api session/createFamily. Browser proof is the Archestra-apply demo frames against OpenSpec scenarios.

## Out of Scope

Graphcool, Stripe, OAuth, academy courses, remote merge, multi-device sync.

## Further Notes

Published locally because `gh` is read-only on this agent. Spec of record: `openspec/changes/local-first-font-editor/`.
