# Esplora MCP

Keyless MCP server for Esplora Bitcoin data: blocks, fees, transactions, addresses.

Pairs well with `blockchain-info-mcp`, `blockchair-mcp`, and `blockcypher-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `tip_height`: Chain tip (set ESPLORA_URL for testnet/other instances).
- `fee_estimates`: sat/vB targets plus mempool stats.
- `get_block`: By height or hash.
- `get_tx`: Confirmation, fee, outputs.
- `get_address`: Balance, tx count, pending.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `recent_blocks`
* `recent_mempool`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-esplora-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
