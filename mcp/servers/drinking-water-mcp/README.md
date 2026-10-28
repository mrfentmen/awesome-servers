# drinking-water-mcp

US drinking water systems from EPA SDWIS: look up a public water system, its violations and its enforcement history.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/drinking-water-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "drinking-water-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/drinking-water-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `water_system` | One public water system by PWSID |
| `search_systems` | Search public water systems in a state by name |
| `violations` | Drinking water violations recorded for a system |
| `enforcement` | Enforcement actions recorded for a system |
| `systems_by_type` | Active water systems of one type in a state |

## Data source

EPA SDWIS
