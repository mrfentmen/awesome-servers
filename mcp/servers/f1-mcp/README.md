# Formula 1 Results

Formula 1 history from the Ergast/Jolpica archive: seasons, race schedules, results and driver standings - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/f1-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "f1-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/f1-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `seasons` | Every Formula 1 season on record, newest first. |
| `schedule` | The race calendar for a season: rounds, circuit, locality and date. |
| `race_results` | Classification of one Grand Prix: position, driver, constructor, grid, laps and status. |
| `driver_standings` | Driver championship standings for a season, at the end or after a chosen round. |

## Data source

Jolpica F1 API, the community continuation of Ergast (api.jolpi.ca/ergast), no key required
