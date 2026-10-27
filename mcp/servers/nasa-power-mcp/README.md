# NASA POWER

NASA POWER climate data: daily temperature, rain, wind and solar series for any coordinate, plus monthly climatology - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nasa-power-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nasa-power-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nasa-power-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `daily_point` | Daily climate series for a coordinate over a date range. |
| `climatology` | Monthly climatology for a coordinate: the long-term average by month. |

## Data source

NASA POWER (Prediction Of Worldwide Energy Resources) API
