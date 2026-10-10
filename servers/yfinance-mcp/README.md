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
- `dividend_history` — Every dividend payment in the range with the total paid per share, the latest payment and its change, and a year by year breakdown.
- `volume_spike` — Latest trading volume against the average of the days before it, with the ratio, a plain verdict and the heaviest days in the window.
- `benchmark_compare` — Compare two to five symbols over the same range by percent return, ranked, with the spread between the best and the worst.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `filing_fundamentals`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-yfinance-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
