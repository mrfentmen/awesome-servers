# Blockchair MCP

Chain statistics for Bitcoin, Ethereum and the other chains Blockchair indexes — blocks, transactions, mempool, price, market cap, dominance and hashrate. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/blockchair-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "blockchair-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/blockchair-mcp"] }
  }
}
```

## Tool

| Tool | What it does |
|---|---|
| `stats` | One chain's headline numbers |

## Example

```
bitcoin — chain statistics

Blocks: 974,790
Transactions: 1,475,221,838
Mempool: 48,852 transactions
Chain size: 745.17 GB
Price: $76,113.00
Market cap: $1.52t
Dominance: 57.60%
```

## Chains

`bitcoin`, `ethereum`, `dogecoin`, `litecoin`, `bitcoin-cash`, `dash`, `ripple`,
`cardano`, `solana` and others. A wrong name returns Blockchair's error.

## Notes

Reads the public Blockchair API. No key, no login.

Blockchair rate limits anonymous callers. A 430 response is reported as
"rate limit reached" rather than an empty result.

`circulation` is in the chain's smallest unit (satoshis for Bitcoin), so it is
labelled rather than shown as a coin count. Converting would need per-chain
decimals.

## Licence

MIT
