# Open Meteo

Use this MCP server to weather forecasts from Open Meteo. No API key, 7 day forecasts, geocoding.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `geocode`: Find a place by name and get its coordinates.
- `get_forecast`: Weather forecast for coordinates.
- `get_forecast_for_place`: Weather forecast for a named place, geocoded for you.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `geocode`.
