# police-transparency-mcp

A deliberately narrow public-data server for aggregate historical NYC police complaint statistics. It is intended for journalism, civic research, and year-over-year trend exploration, not operational policing.

## Tool

- `summarize_complaints`: count historic NYPD complaints grouped by borough, broad law category, or offense description, with an optional year and borough filter.

The server does not expose names, addresses, coordinates, demographics, incident rows, live dispatch, surveillance, targeting, person lookup, or operational controls. Aggregate groups with fewer than five records are suppressed. NYPD complaint data is historical, reported data with known limitations and potential classification or reporting bias. It should not be used to infer individual behavior or make decisions about a person.

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

- `summarize_complaints`: Return aggregate historical NYPD complaint counts grouped by borough, broad law category, or offense description. No names, addresses, coordinates, demographics, incident rows, live dispatch, or person lookup are exposed.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `summarize_complaints`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
