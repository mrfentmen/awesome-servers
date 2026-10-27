# WhiskyHunter MCP

Whisky auction data from the public WhiskyHunter API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `auctions`  Whisky auction results: mean winning bid, trading volume and lots sold per month. Optionally filter to one auction house by slug, e.g. 'bonhams'.
* `auction_by_date`  Every auction house's results for one month, ranked by trading volume.
* `auction_summary`  Aggregate stats for one auction house, or the whole whisky auction market: bids, volumes and lots.
* `top_auctions`  Rank whisky auction houses by total trading volume, lots sold, or average winning bid.
* `market_trend`  Mean winning bid per month over time, for one auction house or the whole market.
* `seasonality`  Show which calendar months historically fetch the highest mean winning bid and volume, averaged across every year in the dataset.
* `auction_compare`  Compare two or more auction houses side by side: record counts, date range, mean and highest winning bid, total volume and their latest months.
* `market_momentum`  Compare the most recent months of whisky auction results against the months before them: mean winning bid, trading volume and lots, with the percent change.
* `auction_leaderboard`  Rank auction houses over the last few recorded months by trading volume, lots sold or mean winning bid, including each house's share of the volume traded.
* `slug_head_to_head`  Two auction houses month by month on volume, lots or winning bid: which one won each month, the tally, and the all-time totals.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public WhiskyHunter API.
