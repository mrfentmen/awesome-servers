# Blockchain.info

Bitcoin chain data from blockchain.info: latest block, BTC price ticker and address balances and transactions - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/blockchain-info-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "blockchain-info-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/blockchain-info-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `latest_block` | The newest Bitcoin block with height, hash and timestamp. |
| `price_ticker` | BTC price across currencies, or one currency in detail. |
| `address_summary` | Balance and recent transactions for a Bitcoin address. |

## Data source

Blockchain.com public API (blockchain.info endpoints)
