# coingecko-mcp

CoinGecko prices and trending coins.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `price` — Current price for one coin id, e.g. bitcoin, in a chosen currency.
- `trending` — Coins trending in CoinGecko search over the last 24 hours.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
