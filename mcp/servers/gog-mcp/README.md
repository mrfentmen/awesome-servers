# GOG MCP

GOG product details from the public GOG API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `browse_games` — Browse the GOG catalogue of DRM-free PC games, sorted by trending, newest, biggest discount, cheapest or rating.
* `search_games` — Search the GOG catalogue by game title and see current prices.
* `deals` — Current GOG discounts, filtered to a minimum percentage off.
* `top_rated` — Highest-rated games on GOG, by user review score.
* `game_details` — Full details for one GOG product by numeric ID: price, platforms, developer, genres and description.
* `games_by_ids` — Look up several GOG products at once from a comma-separated list of product IDs.
* `price_check` — Batch prices for up to 20 product ids: current USD price, list price and discount.
* `browse_by_type` — Browse one product kind (game, dlc or pack) with the real catalog total for that kind.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public GOG API.


