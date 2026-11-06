# Advice Slip MCP

A random piece of advice from Advice Slip. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/adviceslip-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "adviceslip-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/adviceslip-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `random_advice` | One random piece of advice |

## Notes

Advice Slip returns one short suggestion per call. The slip id is stable, so the same advice can be requested again.

## Licence

MIT
