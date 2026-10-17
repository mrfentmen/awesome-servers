# scryfall mcp

MCP server for **Scryfall**, the definitive Magic: The Gathering card database.

## Tools

- `search_cards`, Search Magic: The Gathering cards by Scryfall syntax - card name, oracle text, color, type, e.g. 'c:red type:dragon', 'o:"when ~ enters" legendary creature'.
- `get_card`, Get a single card by fuzzy name (e.g. 'bolas citadel' -> Bolas's Citadel).
- `get_rulings`, Get official Gatherer rulings for a card by fuzzy name.
- `list_sets`, List recent Magic sets with release dates and card counts.
- `random_card`, Get one random Magic card - good for deck ideas, cube picks and discovery.
- `set_cards`, List the cards in one Magic set by set code, e.g. 'dmu', 'blb', 'mh3'.
- `card_price`, Current market prices for a card across TCGplayer (USD, foil and non-foil), Cardmarket (EUR) and MTGO (tix).
- `cards_by_collection`, Resolve up to 75 card names in one request and report the total price plus any name that did not match, so a decklist is checked in one call.
- `card_by_set_number`, Fetch one exact printing by set code and collector number, e.g. lea 233 - the reliable way to a specific printing rather than a search result.
- `mana_symbols`, Scryfall's symbology: every mana and counter symbol with its meaning, mana value and the SVG file, optionally filtered by symbol or wording.
- `card_autocomplete`, Turn a partial or misspelled card name into the real names Scryfall knows, for use in a search that would otherwise come back empty.

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
search_cards { query: "c:red type:dragon" }
get_rulings { name: "bolas citadel" }
```

Keyless. Includes prices (USD + foil), legality friendly fields, image URLs. Throttled to stay under Scryfall's ~10 req/s limit.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_cards`.


