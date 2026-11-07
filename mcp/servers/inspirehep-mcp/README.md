# INSPIRE-HEP MCP

High energy physics papers, authors and citations from INSPIRE-HEP. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/inspirehep-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "inspirehep-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/inspirehep-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_literature` | Search physics literature |

## Notes

Queries use the INSPIRE syntax, e.g. t higgs or a Einstein. Results include arXiv ids when available.

## Licence

MIT
