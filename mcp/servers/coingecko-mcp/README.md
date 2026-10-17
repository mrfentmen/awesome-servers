# coingecko-mcp

CoinGecko prices and trending coins.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `price` — Current price for one coin id, e.g. bitcoin, in a chosen currency.
- `trending` — Coins trending in CoinGecko search over the last 24 hours.
- `markets` — Top coins by market cap with rank and price.
- `coin` — One coin with rank, 24h change, algorithm and categories.
- `chart` — Sampled daily closes for a coin over N days with the period percent change.
- `global` — Total coins and markets plus top-5 dominance shares.
- `categories` — CoinGecko sector categories ranked by market cap, with 24h change and volume.
- `exchanges` — CoinGecko exchange rankings by trust score, with 24h BTC volume and country.
- `search` — Find coin, exchange and category ids on CoinGecko by name or symbol, e.g. solana, aave.
- `history` — Coin price, market cap and volume on a past date, e.g. 20-09-2026.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


