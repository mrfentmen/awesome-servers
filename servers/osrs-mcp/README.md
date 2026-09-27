# osrs mcp

Old School RuneScape player hiscores + Grand Exchange data, straight from
the official Jagex hiscores and the runescape.wiki prices API. No key.

## Tools

- `get_player_stats`, Get an OSRS player's hiscores: levels, XP, clue scrolls and boss kill counts. Modes: normal / ironman / ultimate / hardcore / deadman.
- `get_item_price`, Current Grand Exchange price of an item — what you pay to buy now and what you get selling now.
- `search_items`, Find Grand Exchange items by partial name and get their item IDs and high-alch values.
- `get_hot_items`, What's trading the most on the Grand Exchange right now — ranked by trade volume in the last hour, with buy/sell averages.
- `get_price_history`, Price history for one item: average buy/sell price and trade volume per step. Steps: 5m / 1h / 6h / 24h.
- `get_flip_margins`, Grand Exchange flipping opportunities: buy at the instant-sell price, sell at the instant-buy price, ranked by margin x hourly volume. Filtered by minimum hourly volume so illiquid junk stays out.
- `item_volume`, How much an item really trades: 24h volume against the 4-hourly GE buy limit, or the market's most traded items when no name is given.
- `price_windows`, One item priced in every window the wiki publishes - instant, 5 minutes, 1 hour, 24 hours - with trade counts and how today's price sits against the 24h average.
- `alch_profit`, Rank items by high-alchemy margin - alchemy value minus the current buy price - with the GE buy limit that caps how much can be alched per window.
- `player_compare`, Compare two Old School accounts: total level and XP gap, the skills with the biggest difference, and the activities both players have scores in.

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "Check Zezima's stats"
> `get_player_stats("Zezima")`

> "What's a Bandos chestplate going for?"
> `get_item_price("Bandos chestplate")` → buy 24,459,383 gp / sell 24,440,993 gp
