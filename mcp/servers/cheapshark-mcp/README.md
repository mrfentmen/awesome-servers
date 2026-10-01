# CheapShark MCP

Find game deals and price history from the public CheapShark API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `deals`  Search current game deals under a price cap, optionally filtered by game title or store ID.
* `store_list`  List the game stores CheapShark tracks, with the store IDs used by the other tools.
* `search_games`  Find a game by title and get its cheapest current price plus the gameID for game_details.
* `game_details`  Compare one game's price across every store, plus its cheapest price ever.
* `top_deals`  The best current game deals ranked by CheapShark's deal rating, all stores or one store.
* `free_games`  Games currently free (or 100% off) on any tracked store.
* `steam_lookup`  Find a CheapShark game from its Steam AppID, with the current cheapest price and the gameID for game_details.
* `filter_deals`  Deals filtered by price range, minimum Metacritic score, minimum Steam rating, on-sale or AAA games, sorted cheapest first or by rating.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Deal data comes from the public CheapShark API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `deal_market_scan`
* `store_leaderboard`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
