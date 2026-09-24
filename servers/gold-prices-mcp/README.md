# gold-prices-mcp

Gold and metal prices from gold-api.com (merged).

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `price` — Current price for a metal.
- `all` — Prices for all tracked metals.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
