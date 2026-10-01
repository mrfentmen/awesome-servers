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

- `network_info`: Arweave network: height, peers, queue. Set ARWEAVE_URL for other gateways.
- `tx_status`: Check if an Arweave transaction is confirmed and in which block.
- `wallet_balance`: AR balance of a wallet address.
- `storage_price`: What storing N bytes costs in AR right now.
- `search_by_tag`: Find Arweave transactions by a tag pair, which is how permanent apps label their data, for example App-Name=ArDrive or Content-Type=image/png.
- `address_transactions`: The newest transactions written by one Arweave address, with confirmation height, data size, content type and the tags that identify each upload.
- `block_detail`: One Arweave block in full: mining reward in AR, transaction count, block and weave size, nonce, difficulty and the previous block hash.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `price_table`

Buy a key at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against Polar, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
