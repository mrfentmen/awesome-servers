# Nasdaq Quotes

Nasdaq stock data: live quotes, recent trade history and the most active listed stocks - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nasdaq-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nasdaq-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nasdaq-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `stock_quote` | Quote for one listed symbol: price, change, volume and market status. |
| `stock_history` | Recent daily bars for a symbol: close, open, high, low and volume. |
| `top_stocks` | The Nasdaq screener list: symbol, name, last sale, change, market cap and sector. |

## Data source

Nasdaq public market site endpoints (api.nasdaq.com), no key required
