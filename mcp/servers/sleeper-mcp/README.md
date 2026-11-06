# Sleeper MCP

Current NFL season state from the Sleeper fantasy football API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/sleeper-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "sleeper-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/sleeper-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `league_state` | Current NFL season, week and season type |

## Notes

Sleeper publishes the current NFL season state without a key. No account or league id is needed for this call.

## Licence

MIT
