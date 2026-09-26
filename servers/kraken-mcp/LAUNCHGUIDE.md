# Kraken MCP

## Tagline
Crypto prices from Kraken. No key required.

## Description
Crypto prices from Kraken. No key required. Published from a private commercial monorepo. Not affiliated with or endorsed by Kraken.

## Setup Requirements
- No configuration required. Works out of the box with no API keys.

## Category
Other

## Features

- Ticker: Ticker for one pair, e.g. XBTUSD.
- Assets: Tradeable assets with decimals and status.
- Pairs: How many trading pairs Kraken lists, with a 15-pair sample of wsname tickers. Full list omitted for size.
- OHLC candles: Last 10 candles for a pair as date plus open/high/low/close/volume rows.
- Order book: Top of book for a pair as ask and bid price x volume rows.
- Server time: Kraken server time as RFC1123 string and epoch, useful for timestamping quotes.
- System status: Whether Kraken reports itself online, with the status timestamp.

## Getting Started

- "Ask your assistant about kraken using this server once installed"
- Tool: ticker — Ticker for one pair, e.g. XBTUSD.
- Tool: assets — Tradeable assets with decimals and status.
- Tool: pairs — How many trading pairs Kraken lists, with a 15-pair sample of wsname tickers. Full list omitted for size.
- Tool: ohlc — Last 10 candles for a pair as date plus open/high/low/close/volume rows.
- Tool: depth — Top of book for a pair as ask and bid price x volume rows.
- Tool: time — Kraken server time as RFC1123 string and epoch, useful for timestamping quotes.
- Tool: status — Whether Kraken reports itself online, with the status timestamp.

## Tags
kraken, mcp, shopping, keyless

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/kraken-mcp
