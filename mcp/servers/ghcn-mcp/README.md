# NOAA GHCN Weather

NOAA GHCN station weather: daily and monthly summaries plus extremes for any GHCN station id - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ghcn-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ghcn-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ghcn-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `daily_summaries` | Daily values for a GHCN station over a short window: max/min temperature, rain, snow and wind. |
| `monthly_summaries` | One row per month for a whole year: mean max/min, rain and extremes, from the monthly summaries dataset. |
| `station_extremes` | Scan up to a year of daily data and report the warmest, coldest and wettest days. |

## Data source

NOAA NCEI Access Data Service (daily-summaries and global-summary-of-the-month datasets), no key required
