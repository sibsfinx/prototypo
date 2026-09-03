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

To use those families in the Vite app, paste/import that JSON into localStorage. Node export does **not** need FontMediator workers.

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
| `set_params` | `variantId`, `values` | updated values |
| `list_alternates` | `templateName` | unicodes with `_alt` glyphs |
| `set_alternate` | `variantId`, `unicode`, `glyphName` | values with baked `altList` |
| `describe_opentype` | `templateName` | honest GSUB/liga/ssXX report (usually none) |
| `export_otf` | `variantId`, optional `outPath` | path + byte size of an unmerged CFF OTF |

`export_otf` runs `FontPrecursor` + `fontToSfntTable` in Node. No `merge.prototypo.io`. No GSUB: CSS `liga`/`dlig`/`ss01` will not change glyphs. Alternates must be baked with `set_alternate` first.

Specimen: `pnpm mcp:demo` writes `mcp/demo/fonts/*.otf`. Open `mcp/demo/index.html`.

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
