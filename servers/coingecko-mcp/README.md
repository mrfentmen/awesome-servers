# coingecko-mcp

CoinGecko prices and trending coins.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `price` — Price for one or more coins.
- `trending` — Trending coins on CoinGecko.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
