# runescape-mcp

RuneScape hiscores, OSRS stats, and Grand Exchange prices.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `hiscore` — Hiscore for a RuneScape player.
- `getPlayerStats` — OSRS player stats.
- `getItemPrice` — OSRS Grand Exchange item price.
- `getHotItems` — OSRS hot items.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
