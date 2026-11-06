# Deribit MCP

Public market data from Deribit — crypto futures and options instruments, and live tickers. Keyless.

Keyless — no signup, no API key, no environment variables. Public endpoints only; this server cannot place orders.

## Install

```bash
npx -y @mrfentmen/deribit-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "deribit-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/deribit-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `instruments` | Instruments for a currency and kind, soonest expiry first |
| `ticker` | Last, mark, index, bid/ask, volume, open interest and funding |

## Example

```
BTC future instruments — 12 total, showing 5

1. BTC-PERPETUAL — perpetual

BTC-PERPETUAL

Last: 76,119.50
Mark: 76,118.11
Index: 76,119.45
Open interest: 697,989,010
Funding 8h: 0.0028%
```

## Notes

Reads Deribit's public API. No key, no login.

Perpetuals have no expiry, so their date shows as `perpetual`. Dated futures and
options show the expiry date, and options also show strike and call/put.

Prices are in the quote currency (USD for BTC and ETH instruments).

This is market data only. No account, no orders, no balances.

## Licence

MIT
