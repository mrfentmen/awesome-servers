# Homebrew MCP

Homebrew formula details, versions and dependencies. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/homebrew-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "homebrew-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/homebrew-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_formula` | Details for a Homebrew formula |

## Notes

Formula names are lowercase, e.g. wget or node. The JSON includes the stable version, licence and dependencies.

## Licence

MIT
