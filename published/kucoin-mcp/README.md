# kucoin-mcp

Keyless KuCoin market data: server time, symbols, 24h stats, order books, klines, fiat prices.

## Setup

No API key needed.

Note: KuCoin geo-restricts some market endpoints by IP region; `get_server_time`
and unrestricted endpoints work everywhere.

## Tools

- `get_server_time` — KuCoin server timestamp for clock sync.
- `list_symbols` — KuCoin trading pairs with base/quote currencies. Optional quote filter like USDT.
- `get_24h_stats` — 24h KuCoin stats for a symbol: last price, high, low, change rate, volume.
- `get_orderbook` — KuCoin order book top bids and asks for a symbol.
- `get_klines` — KuCoin candlesticks for a symbol: time, open, close, high, low, volume.
- `get_fiat_prices` — Fiat prices for crypto currencies, e.g. BTC and ETH in USD.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
