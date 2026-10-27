# Old School RuneScape MCP

## Tagline
Hiscores and Grand Exchange prices. Keyless.

## Description
MCP server for Old School RuneScape, player hiscores and Grand Exchange prices via the official wiki API.

## Setup Requirements
- API key as documented in README where required (all free tiers/self-serve).

## Category
Games

## Features

- Get player stats: Get an OSRS player's hiscores: levels, XP, clue scrolls and boss kill counts. Modes: normal / ironman / ultimate / hardcore / deadman.
- Get item price: Current Grand Exchange price of an item — what you pay to buy now and what you get selling now.
- Search items: Find Grand Exchange items by partial name and get their item IDs and high-alch values.
- Get hot items: What's trading the most on the Grand Exchange right now — ranked by trade volume in the last hour, with buy/sell averages.
- Get price history: Price history for one item: average buy/sell price and trade volume per step. Steps: 5m / 1h / 6h / 24h.
- Get flip margins: Grand Exchange flipping opportunities: buy at the instant-sell price, sell at the instant-buy price, ranked by margin x hourly volume. Filtered by minimum hourly volume so illiquid junk stays out.
- Item volume: How much an item really trades: 24h volume against the 4-hourly GE buy limit, or the market's most traded items when no name is given.
- Price windows: One item priced in every window the wiki publishes - instant, 5 minutes, 1 hour, 24 hours - with trade counts and how today's price sits against the 24h average.
- Alchemy profit: Rank items by high-alchemy margin - alchemy value minus the current buy price - with the GE buy limit that caps how much can be alched per window.
- Compare players: Compare two Old School accounts: total level and XP gap, the skills with the biggest difference, and the activities both players have scores in.

## Getting Started

- "Abyssal whip price"
- Tool: get_player_stats — Get an OSRS player's hiscores: levels, XP, clue scrolls and boss kill counts. Modes: normal / ironman / ultimate / hardcore / deadman.
- Tool: get_item_price — Current Grand Exchange price of an item — what you pay to buy now and what you get selling now.
- Tool: search_items — Find Grand Exchange items by partial name and get their item IDs and high-alch values.
- Tool: get_hot_items — What's trading the most on the Grand Exchange right now — ranked by trade volume in the last hour, with buy/sell averages.
- Tool: get_price_history — Price history for one item: average buy/sell price and trade volume per step. Steps: 5m / 1h / 6h / 24h.
- Tool: get_flip_margins — Grand Exchange flipping opportunities: buy at the instant-sell price, sell at the instant-buy price, ranked by margin x hourly volume. Filtered by minimum hourly volume so illiquid junk stays out.
- Tool: item_volume — How much an item really trades: 24h volume against the 4-hourly GE buy limit, or the market's most traded items when no name is given.
- Tool: price_windows — One item priced in every window the wiki publishes - instant, 5 minutes, 1 hour, 24 hours - with trade counts and how today's price sits against the 24h average.
- Tool: alch_profit — Rank items by high-alchemy margin - alchemy value minus the current buy price - with the GE buy limit that caps how much can be alched per window.
- Tool: player_compare — Compare two Old School accounts: total level and XP gap, the skills with the biggest difference, and the activities both players have scores in.

## Tags
runescape, osrs, gaming, prices, keyless

## Documentation URL
https://github.com/mrfentmen/awesome-servers/tree/main/servers/osrs-mcp
