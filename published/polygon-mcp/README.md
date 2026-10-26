# polygon-mcp

Query Polygon.io (free key; set POLYGON_API_KEY, query param): tickers, ticker details, daily aggregates.

## Tools

- `list_tickers` — Reference tickers, with name and market.
- `get_ticker` — One ticker's reference details by symbol.
- `prev_close` — Previous day's bar: open, high, low, close, volume.

- `aggregates` — Custom date range.
- `grouped_daily` — Whole-market daily bars.
- `open_close` — OHLC for a day.
- `rsi` — Relative strength.
- `macd` — Trend momentum.
- `dividends` — Dividend history.
- `splits` — Split history.
- `news` — Latest news.
- `gainers` — Day's biggest gainers.

## Source

[polygon-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/polygon-mcp)
