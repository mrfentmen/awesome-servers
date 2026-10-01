# helius-mcp

Helius Solana API: balances, transactions, NFTs, token metadata, parsed transactions.

## Setup

```bash
export HELIUS_API_KEY=YOUR_KEY
```

## Tools

- `get_balances` — Solana wallet balances via Helius: SOL plus every token holding with amounts and decimals.
- `get_transactions` — Recent Solana signatures for an address with slot and block time.
- `get_nfts` — NFTs held by a Solana wallet: collections, names, images.
- `get_token_metadata` — Fungible token metadata for Solana mints: decimals, supply, name, symbol.
- `parse_transactions` — Human-readable Helius parse of Solana transactions: type, source, transfers, swaps.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `wallet_holdings`
* `token_market`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-helius-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
