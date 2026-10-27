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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_tide_predictions`: Get NOAA high low or hourly tide predictions for a station and date range.
- `get_water_levels`: Get observed NOAA water levels for a station and short date range.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_tide_predictions`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
