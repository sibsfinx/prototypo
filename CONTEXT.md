# CONTEXT

Prototypo is a parametric font editor. This fork runs **local-first**: no Graphcool, no Stripe, no OAuth.

## Glossary

| Term | Meaning | Avoid |
| --- | --- | --- |
| **Local session** | Browser `localStorage` auth + DB that replaces Graphcool. Token `local-prototypo-token`. | "logged-out mode", "demo user" |
| **Local DB** | JSON blob at `prototypo-local-db` holding user, families, variants. | "cache", "hoodie store" |
| **Template** | A `.ptf` parametric source (Spectral, Antique Gothic, Elzevir, Grotesk, Fell) served as `/templates/<name>/font.json`. | "preset" (presets are a different GraphQL type) |
| **Family** | A user project created from a template. | "font file" |
| **Variant** | One cut of a family (default Regular) with slider `values`. | "style" unless the UI says style |
| **Control init** | The `init` value on `controls[].parameters[]` in template JSON. Merged before glyph construction so missing slider params are not `undefined`. | "default parameter" without saying where it lives |
| **Formula** | A parametric operation. Missing or NaN params evaluate as `0`. | "expression", "glyph math" |
| **Dashboard** | The editor after onboarding: glyph canvas, word preview, left-rail sliders. | "app home" |
| **Library** | `#/library/home` listing templates and the user's families. | "catalog" |

## Runtime

- Node ≥ 24 (Active LTS), pnpm 11 (`shamefully-hoist`), Vite 5 on port 9000.
- `pnpm start` copies templates then serves `app/` with `public/` as Vite public dir.
- Academy courses are stubbed. Remote `merge.prototypo.io` is skipped unless `MERGE` is set.
