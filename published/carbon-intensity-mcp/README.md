# UK Carbon Intensity

UK grid carbon intensity: live gCO2/kWh, half-hourly forecast and the current generation mix - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/carbon-intensity-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "carbon-intensity-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/carbon-intensity-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `current_intensity` | Live carbon intensity for the UK grid with the published index band. |
| `intensity_forecast` | Forecast intensity for the next few hours, in half-hour steps. |
| `generation_mix` | Share of each fuel in the current UK generation mix. |

## Data source

National Grid ESO Carbon Intensity API (UK)
