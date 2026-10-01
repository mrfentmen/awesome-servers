# kma-mcp

Korean KMA forecasts via data.go.kr: village forecast, ultra-short forecast and observations.

## Setup

```bash
export DATAGO_KR_API_KEY=...
```

Needs a free data.go.kr API key (serviceKey). Seoul grid: nx=60, ny=127.

## Tools

- `get_forecast` — KMA 3-day village forecast: temp, rain probability, sky, wind, humidity. Defaults to latest release and Seoul grid.
- `get_ultrashort` — KMA 6-hour ultra-short forecast for a grid point, updated every 30 minutes.
- `get_observations` — Latest KMA observations for a grid point: temp, rain, humidity, wind.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
