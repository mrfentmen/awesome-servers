# etherscan-mcp

Query the Etherscan v2 API (free key; set ETHERSCAN_API_KEY; chainid default 1): ETH balance, transactions, ERC-20 transfers.

## Tools

- `get_balance` — Native balance for an address.
- `get_transactions` — Recent normal transactions for an address.
- `get_token_transfers` — Recent ERC-20 transfers to or from an address.

- `tx_status` — Receipt status by hash.
- `contract_abi` — Verified ABI.
- `contract_source` — Verified source info.
- `token_balance` — ERC-20 balance.
- `gas_oracle` — Current gas tiers.
- `eth_price` — ETH/USD price.
- `block_number` — Latest block.

## Source

[etherscan-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/etherscan-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `internal_transactions`
* `event_logs`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-etherscan-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
