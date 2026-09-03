## Context

Graphcool is gone. The editor still expects Apollo 1 GraphQL, template JSON, and a full precursor build. The Vite migration left webpack-only loaders and `this` in UMD `please-wait`. Missing serif/control params produced NaN `advanceWidth` and a blank dashboard.

## Goals

- Boot the Vite app and land in the library with templates.
- Create a family without an account.
- Customize with sliders without NaN/OTS failure.

## Non-Goals

- Restore Graphcool, Stripe, OAuth, or `merge.prototypo.io`.
- Academy course content (stub).
- Multi-device persistence.

## Decisions

- Keep Apollo 1; swap the network interface for `executeLocalQuery`.
- Copy `.ptf` `dist/font.json` into `public/templates/` at start (gitignored).
- Merge `controlInits` in `constructFont`; Formula maps non-numeric params to `0`.
- Skip merge unless `process.env.MERGE`.

## Risks

- Jest 22 does not run native ESM well; unit seams use `node --test`.
- Nightwatch e2e still assumes remote login and is out of this change.
