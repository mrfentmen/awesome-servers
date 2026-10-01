# PredictIt MCP

Prediction market contracts and prices from the public PredictIt API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `markets`  List PredictIt prediction markets with their leading contract, ranked by that contract's yes price. A yes price is the market's implied probability.
* `search_markets`  Search PredictIt markets by keyword, e.g. 'election', 'Fed', 'bitcoin', 'oscars'.
* `market_detail`  Every contract in one market with full buy/sell yes and no prices.
* `contract_price`  Price and implied probability for one named contract inside a market.
* `biggest_movers`  Contracts whose last trade price moved most versus the previous close, across all markets.
* `market_summary`  Totals across PredictIt right now — how many markets are open, how many contracts trade — plus the most contested open markets.
* `arbitrage_check`  Add up every YES price in each open PredictIt market and flag fields whose total is under $1.00, where buying the whole field could cost less than the payout. Only applies to markets whose outcomes are mutually exclusive.
* `compare_markets`  Two to five markets side by side, contract by contract, with today's move on each and which market is the most decided and which is the most open.
* `search_contracts`  Search the tradeable contracts across every market by name, with each contract's price, last trade and the market it belongs to.
* `long_shots`  Open contracts the market prices as unlikely, cheapest first, with the multiple each one returns if it pays out and the market it sits in.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public PredictIt market data API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `expiry_ladder`
* `spread_analysis`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
