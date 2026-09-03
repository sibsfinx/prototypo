# ADR 0001: Local session instead of Graphcool

## Status

Accepted

## Context

The original app authenticated against Graphcool and AWS lambdas. Those backends are gone. Signup UI said the product was shut down. The editor still spoke GraphQL through Apollo 1.

## Decision

Keep the Apollo 1 / GraphQL surface. Implement it in-process against `localStorage` (`prototypo-local-db`) and auto-issue token `local-prototypo-token` so the library and dashboard load with no account.

## Consequences

Fonts persist only in that browser. Multi-device sync and billing are out of scope. GraphQL field names stay the legacy schema so UI components do not need a second API.
