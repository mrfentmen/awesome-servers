# Hex MCP

Erlang and Elixir package metadata from hex.pm. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hex-pm-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hex-pm-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hex-pm-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `package` | Package details from hex.pm |

## Notes

Hex is the package registry for the BEAM ecosystem. Package metadata is public.

## Licence

MIT
