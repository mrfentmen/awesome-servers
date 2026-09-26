# Predictit MCP

## Tagline
Prediction market contracts and prices from PredictIt. No key required.

## Description
Prediction market contracts and prices from PredictIt. No key required. Published from a private commercial monorepo. Not affiliated with or endorsed by Predictit.

## Setup Requirements
- No configuration required. Works out of the box with no API keys.

## Category
Data & Analytics

## Features

- Markets: List PredictIt prediction markets with their leading contract, ranked by that contract's yes price. A yes price is the market's implied probability.
- Search markets: Search PredictIt markets by keyword, e.g. 'election', 'Fed', 'bitcoin', 'oscars'.
- Market detail: Every contract in one market with full buy/sell yes and no prices.
- Contract price: Price and implied probability for one named contract inside a market.
- Biggest movers: Contracts whose last trade price moved most versus the previous close, across all markets.
- Exchange summary: Totals across PredictIt right now — how many markets are open, how many contracts trade — plus the most contested open markets.
- Arbitrage check: Add up every YES price in each open PredictIt market and flag fields whose total is under $1.00, where buying the whole field could cost less than the payout. Only applies to markets whose outcomes are mutually exclusive.

## Getting Started

- "Ask your assistant about predictit using this server once installed"
- Tool: markets — List PredictIt prediction markets with their leading contract, ranked by that contract's yes price. A yes price is the market's implied probability.
- Tool: search_markets — Search PredictIt markets by keyword, e.g. 'election', 'Fed', 'bitcoin', 'oscars'.
- Tool: market_detail — Every contract in one market with full buy/sell yes and no prices.
- Tool: contract_price — Price and implied probability for one named contract inside a market.
- Tool: biggest_movers — Contracts whose last trade price moved most versus the previous close, across all markets.
- Tool: market_summary — Totals across PredictIt right now — how many markets are open, how many contracts trade — plus the most contested open markets.
- Tool: arbitrage_check — Add up every YES price in each open PredictIt market and flag fields whose total is under $1.00, where buying the whole field could cost less than the payout. Only applies to markets whose outcomes are mutually exclusive.

## Tags
predictit, mcp, shopping, keyless

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/predictit-mcp
