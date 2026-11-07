# Tranco MCP

Tranco popularity ranking for domains, from the research grade top sites list. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/tranco-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "tranco-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/tranco-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `domain_rank` | Popularity rank history for a domain |

## Notes

Tranco combines several top site lists into one ranking. Lower ranks are more popular; rank 1 is the most visited domain.

## Licence

MIT
