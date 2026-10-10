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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `sec_filings`
* `sec_revenue`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-polygon-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
