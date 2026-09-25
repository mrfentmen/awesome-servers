# osrs mcp

Old School RuneScape player hiscores + Grand Exchange data, straight from
the official Jagex hiscores and the runescape.wiki prices API. No key.

## Tools

- `get_player_stats`, levels, XP, clue scrolls, boss kill counts
(modes: normal / ironman / ultimate / hardcore / deadman)
- `get_item_price`, current GE buy/sell for any item
- `get_hot_items`, what's trading the most right now (volume, last hour)

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "Check Zezima's stats"
> `get_player_stats("Zezima")`

> "What's a Bandos chestplate going for?"
> `get_item_price("Bandos chestplate")` → buy 24,459,383 gp / sell 24,440,993 gp
