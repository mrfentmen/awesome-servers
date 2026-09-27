# open-meteo-mcp

Open-Meteo weather, geocoding, elevation, and UV forecasts.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `geocode` — Find a place by name.
- `getForecast` — Weather forecast for coordinates.
- `getForecastForPlace` — Forecast for a named place.
- `elevation` — Elevation for coordinates.
- `uvForecast` — Daily UV index forecast.

- `air_quality`
- `marine`
- `flood`
- `hourly`
## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
