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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
