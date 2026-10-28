# energy-charts-mcp

European electricity data: live generation mix, day-ahead prices, installed capacity and renewable share - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/energy-charts-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "energy-charts-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/energy-charts-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `power_mix` | Current electricity generation mix for a country |
| `day_ahead_price` | Day-ahead electricity prices for a bidding zone |
| `installed_power` | Installed generation capacity by type for a country |
| `renewable_share` | Renewable share of generation, with solar and wind split |
| `power_series` | Average generation by type over a date range |

## Data source

Energy-Charts (Fraunhofer ISE)
