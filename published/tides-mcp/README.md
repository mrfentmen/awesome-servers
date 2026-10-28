# tides-mcp

A small MCP server for coastal planning with NOAA CO-OPS tide data. It is useful for fishing, kayaking, tidepool trips, photography, flood awareness, and checking whether a tide window is worth investigating.

## Tools

- `get_tide_predictions`: high and low predictions or hourly predictions for a station and date range.
- `get_water_levels`: observed water levels for a station and date range.

The server uses the public NOAA CO-OPS API and needs no key. Dates use `YYYY-MM-DD`; station ids are NOAA station identifiers such as `9414290`. Requests time out after 20 seconds.

## Run

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio MCP transport and does not write files or contact any service other than NOAA.
