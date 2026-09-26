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

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Deal data comes from the public CheapShark API.
