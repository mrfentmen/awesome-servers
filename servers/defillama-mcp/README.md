# defillama-mcp

DefiLlama protocols, chains, and TVL (merged).

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `chains` — Total value locked per chain, biggest first.
- `protocol` — TVL history for a protocol slug, e.g. aave.
- `top_protocols` — Get the top DeFi protocols by TVL.
- `chain_tvl` — Total value locked for every chain in one call.
- `protocol_info` — Get details for a specific protocol.
- `topYields` — Highest-APY DeFi pools with project, chain, APY and TVL.
- `hacks` — Largest recent DeFi hacks with date, target, chain, amount and technique.
- `stablecoins` — Stablecoin circulating value by asset, with peg mechanism, price and 7-day change.
- `dex_volume` — DeFi DEX trading volume: 24h, 7d and all-time totals plus the busiest protocols.
- `fees_overview` — DeFi protocol fees: 24h, 7d and all-time totals plus the protocols charging the most.

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

* `stablecoin_history`
* `aggregator_volume`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
