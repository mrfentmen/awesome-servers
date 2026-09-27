# alpaca-mcp

Query Alpaca paper trading (set ALPACA_API_KEY_ID + ALPACA_API_SECRET_KEY, header auth; optional ALPACA_BASE_URL): account, positions, orders.

## Tools

- `account` — Buying power, equity and cash for the trading account.
- `positions` — Open positions with symbol, quantity and unrealized P/L.
- `orders` — Recent orders with side, quantity, status and fill price.

- `order_details` — Single order.
- `position_details` — Position in symbol.
- `market_clock` — Open/closed + times.
- `calendar` — Open days.
- `list_assets` — Tradable US equities.
- `watchlists` — Saved watchlists.
- `portfolio_history` — Equity curve.

## Source

[alpaca-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/alpaca-mcp)
