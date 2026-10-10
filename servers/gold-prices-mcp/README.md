# gold-prices-mcp

Gold and metal prices from gold-api.com (merged).

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `price` — Live spot price for one metal or asset in USD, with the quote source and timestamp. Accepts a ticker (XAU) or a name (gold).
- `all` — Spot prices for the four precious metals in one call: gold, silver, platinum and palladium.
- `market_overview` — One call for every asset the price feed tracks — precious metals, copper, Bitcoin and Ethereum — with live USD prices.
- `symbols` — The ticker symbols this price feed supports, so an agent knows which values price and convert accept.
- `convert` — Value an amount of one asset in USD, or in another tracked asset, using live prices. Example: 2 ounces of gold in USD, or 100 grams of silver in gold.
- `portfolio_value` — Value a list of metal and crypto holdings in USD at live prices, with each holding's share of the total. Example: XAU:2, XAG:100, BTC:0.5.
- `metal_ratios` — Live ratios traders watch — gold/silver, gold/platinum, gold/palladium, gold/copper and bitcoin/gold — both sides quoted at once.
- `melt_value` — Metal content value of a weight in any bullion unit (g, troy oz, dwt, tola, kg) at any purity.
- `premium_check` — What you paid versus live melt value: premium in dollars and percent, with a plain reading.
- `price_trend` — Daily close trend for a metal over 5d to 1y: change, range and the last ten closes.

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

These tools need a licence key:

* `tokenised_metal`
* `futures_curve`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
