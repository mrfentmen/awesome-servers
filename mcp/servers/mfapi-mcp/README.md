# Indian Mutual Funds

Indian mutual fund NAVs from MFapi: search schemes by name, read the latest NAV, and pull a NAV history - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/mfapi-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "mfapi-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/mfapi-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_schemes` | Find mutual fund schemes by name, returning scheme codes. |
| `latest_nav` | Latest published NAV plus scheme metadata for a scheme code. |
| `nav_history` | Recent NAV history for a scheme, newest first. |

## Data source

MFapi.in (AMFI published NAV data)
