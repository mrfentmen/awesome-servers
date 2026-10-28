# pokemon tcg mcp

The Pokémon TCG via [TCGdex](https://www.tcgdex.dev/), open database, no key.

## Tools

- `search_cards`, search by name, filter by rarity
- `get_card`, full card: HP, types, abilities, attacks, weakness, market prices
- `list_sets`, all sets, newest first
- `get_set`, a set with its full card list

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "Show me Charizard's Vivid Voltage card"
> `search_cards("charizard")` → `get_card("swsh4-25")`
