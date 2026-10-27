# US Drought Monitor

US Drought Monitor statistics: drought severity shares by state, weekly, straight from the USDM API - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/drought-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "drought-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/drought-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `state_drought` | Drought severity shares for one state over a date range. |
| `compare_states` | Latest drought shares for several states side by side. |

## Data source

US Drought Monitor data services (NDMC / University of Nebraska-Lincoln)
