# PredictIt MCP

Prediction market contracts and prices from the public PredictIt API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `markets`  List PredictIt prediction markets with their leading contract, ranked by that contract's yes price.
* `search_markets`  Search PredictIt markets by keyword, e.g. 'election', 'Fed', 'bitcoin', 'oscars'.
* `market_detail`  Every contract in one market with full buy/sell yes and no prices.
* `contract_price`  Price and implied probability for one named contract inside a market.
* `biggest_movers`  Contracts whose last trade price moved most versus the previous close, across all markets.
* `market_summary`  Totals across PredictIt right now — how many markets are open, how many contracts trade — plus the most contested open markets.
* `arbitrage_check`  Add up every YES price in each open PredictIt market and flag fields whose total is under $1.00, where buying the whole field could cost less than the payout. Only applies to markets whose outcomes are mutually exclusive.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public PredictIt market data API.
