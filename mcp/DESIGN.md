# Prototypo MCP server (phase 1)

Opus planning hit `resource_exhausted`. This design is the implementable plan Grok used.

## Goal

Local stdio MCP so an agent can list bases, create a family, read sliders, and set Width/Slant **without** the browser. No Graphcool, Stripe, or OAuth.

## Transport

- Node stdio via `@modelcontextprotocol/sdk` (`McpServer` + `StdioServerTransport`).
- stdout is JSON-RPC only; logs go to stderr.
- Command: `node mcp/server.mjs` (cwd = repo root). `pnpm mcp`.

## Persistence (honest)

Browser families live in `localStorage` key `prototypo-local-db`. Node cannot see that.

Phase 1 uses a **file** with the same JSON shape as `app/scripts/services/local-api.js`:

- `PROTOTYPO_DB_PATH` or `~/.prototypo/prototypo-local-db.json`
- Same records: `user`, `families`, `variants`, …

To use those families in the Vite app, paste/import that JSON into localStorage (phase 2 could add a tiny import hook). Export OTF is phase 2 (needs FontMediator workers).

## Templates

Read `node_modules/<pkg>/dist/font.json` (same sources `scripts/copy-templates` copies). No network.

| Library | templateName |
| --- | --- |
| Spectral | gfnt.ptf |
| Antique Gothic | antique.ptf |
| Prototypo Elzevir | elzevir.ptf |
| Prototypo Grotesk | venus.ptf |
| Prototypo Fell | john-fell.ptf |

## Tools

| Tool | Args | Returns |
| --- | --- | --- |
| `list_templates` | — | name, templateName, familyName |
| `get_controls` | `templateName` | slider defs (`name`, `label`, `init`, min/max) |
| `create_family` | `name`, `templateName` | family + Regular variant seeded from control inits |
| `list_families` | — | families with variant ids |
| `get_variant_values` | `variantId` | stored `values` |
| `set_param` | `variantId`, `name`, `value` | updated values |

## Security

Local process, local files only. Does not fetch fonts or upload values. `templateName` is allow-listed to the five packages (no path traversal into `node_modules`/elsewhere). `set_param` rejects names that are not in that template's controls.

## Cursor config

```json
{
  "mcpServers": {
    "prototypo": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "cwd": "<repo root>"
    }
  }
}
```

## Tests

Unit tests on handlers (`__tests__/unit/mcp-prototypo.test.mjs`) with a temp DB path. No stdio required.
