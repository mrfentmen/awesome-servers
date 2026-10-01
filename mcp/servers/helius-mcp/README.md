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

These tools need a licence key:

* `wallet_holdings`
* `token_market`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
