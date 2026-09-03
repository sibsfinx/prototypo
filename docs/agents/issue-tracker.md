# Issue tracker: GitHub, with a writable local fallback

Issues and specs for this repo are intended to live as GitHub issues (`sibsfinx/prototypo`). Use the `gh` CLI when it can write.

OpenSpec (`openspec/`) is the spec of record for behavior. Matt Pocock `/to-spec` output is published:

1. As a GitHub issue labelled `ready-for-agent`, when `gh issue create` succeeds.
2. Otherwise as a markdown file under `.scratch/<change-name>.md` (cloud agents in this environment have a **read-only** `gh`).

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. On permission errors, write `.scratch/<slug>.md` instead and say so.
- **Read an issue**: `gh issue view <number> --comments`.
- **List issues**: `gh issue list --state open`.
- **OpenSpec change**: `openspec/changes/<name>/` — proposal, specs, design, tasks, demo-storyboard.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a GitHub issue if writable; else write `.scratch/<slug>.md`.

## When a skill says "fetch the relevant ticket"

Prefer the active OpenSpec change. Then `gh issue view` if a number is known. Then `.scratch/`.
