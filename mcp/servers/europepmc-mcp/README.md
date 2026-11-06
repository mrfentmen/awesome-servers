# Europe PMC MCP

Search biomedical and life-science literature on Europe PMC — titles, authors, journal, year, citation counts and ids. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/europepmc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "europepmc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/europepmc-mcp"] }
  }
}
```

## Tool

| Tool | What it does |
|---|---|
| `search` | Papers matching a query, with authors, journal, year, citations and DOIs |

## Example

```
"malaria vaccine" — 292639 papers

1. Accelerating the clinical development of treatments for dengue...
   Chan XHS, Durbin AP, Malavige GN · The Lancet. Microbe · 2026 · cited 0
   pmid 42685738 · doi 10.1016/j.lanmic.2026.101451
```

## Query syntax

Plain words work. Europe PMC's own fields work too:

- `TITLE:dengue`
- `AUTH:"Smith J"`
- `PUB_YEAR:2025`
- `OPEN_ACCESS:Y`
- `malaria AND vaccine`

## Notes

Reads the public Europe PMC REST API. No key, no login.

Results use the `lite` view. That carries title, authors, journal, year,
citation count and ids, but no abstract — the full record is much larger and
would flood a conversation.

Paging is by cursor: pass the `Next cursor` value from one result back as
`cursor`. Offsets are not supported by the API.

## Licence

MIT
