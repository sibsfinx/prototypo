# Agent instructions

## Agent skills

### Issue tracker

GitHub issues on `sibsfinx/prototypo`, with `.scratch/` when `gh` cannot write. OpenSpec is the spec of record. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md` and `CONTEXT.md`.

### Workflow

- **OpenSpec**: `/opsx-propose`, `/opsx-apply`, `/opsx-archive`. CLI: `openspec` or `npx --yes @fission-ai/openspec@latest`.
- **Matt Pocock**: `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement`, plus model skills `tdd` and `code-review`. Installed under `.agents/skills/` (linked from `.cursor/skills/`).
- **Archestra-apply**: `/archestra-apply` — plan → build → test → demo-record → verify-per-frames-and-spec. Skill: `.cursor/skills/archestra-apply/SKILL.md`.
- **MCP Hub skills** (from [sibsfinx/mcp-hub](https://github.com/sibsfinx/mcp-hub); `sibsfinx/sklills` does not exist): Tavily, Krisp, Google Workspace, Bugsnag under `.agents/skills/` (linked from `.cursor/skills/`).
