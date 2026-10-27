# nyc311-mcp

Explore public NYC 311 service-request data for civic research, neighborhood-level trend analysis, and city-service questions.

## Tools

- `search_requests`: search bounded request metadata by complaint type, borough, agency, and dates.
- `count_requests`: aggregate request totals by complaint type with the same filters.

The server intentionally excludes street addresses, latitude, longitude, and other precise location fields. NYC 311 records are reports of requests, not verified findings, and may contain reporting delays or duplicates. The public Socrata API requires no key for these read-only queries.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_requests`: Search recent public NYC 311 requests using non-location-identifying fields. Addresses and coordinates are intentionally excluded.
- `count_requests`: Count NYC 311 requests grouped by complaint type with optional date, borough, and agency filters.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_requests`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
