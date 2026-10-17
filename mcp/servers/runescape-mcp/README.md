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


