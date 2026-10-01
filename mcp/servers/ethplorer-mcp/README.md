# Ethplorer MCP

Ethereum token explorer: token info, address holdings, transaction history. No key required for low volume. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `token_info`  Get ERC-20 token details by address.
* `address_info`  Get token holdings for an address.
* `token_history`  Transfer history for a token address, newest first.
* `topTokens`  Top ERC-20 tokens by activity with holder and transaction counts.
* `tokenHolders`  Largest holders of a token with balances and share percent.
* `addressHistory`  Token operations involving an address, newest first.
* `last_block`  Current Ethereum head block height, useful for timestamping the other lookups.
* `address_transactions`  Latest plain ETH transfers for an address, with direction and USD value — token movements live in address_history.
* `tx_info`  One Ethereum transaction by hash: status, sender, receiver, value, gas used and fee, plus token transfer and log counts.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Ethplorer API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `top_tokens_by`
* `new_tokens`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
