# Arweave MCP

Keyless MCP server for Arweave: network info, transactions, wallet balances, storage price.

Pairs well with `storj-mcp`, `coverartarchive-mcp`, and the Bitcoin set.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `network_info`: Height, peers, queue (set ARWEAVE_URL for other gateways).
- `tx_status`: Confirmed or pending, block height.
- `wallet_balance`: AR balance.
- `storage_price`: Cost in AR for N bytes.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.
