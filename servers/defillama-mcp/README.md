# defillama-mcp

DefiLlama protocols, chains, and TVL (merged).

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `chains` — TVL by chain.
- `protocol` — TVL history for a protocol.
- `top_protocols` — Get the top DeFi protocols by TVL.
- `chain_tvl` — Get TVL for all chains.
- `protocol_info` — Get details for a specific protocol.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
