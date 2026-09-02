## Why

The Graphcool backend is dead, so the Vite app could not open a library or build a font. Designers need to create a family from a template and customize it with sliders in the browser, with no account.

## What Changes

- Auto **local session** (token + localStorage DB) so the app skips dead signup.
- Serve parametric **templates** as static JSON and load them with `fetch`.
- Create a **family** + Regular **variant** from a template and persist them locally.
- Build glyphs using **control inits** and Formula `0` defaults so sliders cannot NaN the font.
- Vite runtime (Flow strip, ESM config, SVG/`please-wait` shims) so `yarn start` actually boots the editor.

## Capabilities

### New Capabilities

- `local-session`: in-browser auth and GraphQL that replace Graphcool
- `font-library`: templates listed and families stored locally
- `font-customization`: create from template, dashboard sliders update the live font

### Modified Capabilities

<!-- none — empty main specs tree -->

## Impact

Apollo network interface, `local-api`, template copy script, `FontPrecursor`/`Formula`, Vite config. No remote billing or merge. Academy remains stubbed.
