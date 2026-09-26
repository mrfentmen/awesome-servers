# yfinance-mcp

Yahoo Finance quotes and symbol search.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `quote` — Get a stock quote and recent price data.
- `search` — Search stock symbols by company name, e.g. apple.
- `search_symbol` — Search for a symbol by company name.
- `gainers` — Equities with the greatest gains today with price and percent change.
- `losers` — Equities with the greatest losses today with price and percent change.
- `actives` — Most actively traded equities with price and percent change.
- `trending` — Trending US ticker symbols. Use quote for prices.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
