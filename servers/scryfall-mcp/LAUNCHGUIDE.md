# Scryfall MCP

## Tagline
Use this MCP server to Scryfall, Magic: The Gathering card database with rulings, printings, and pri

## Description
Use this MCP server to Scryfall, Magic: The Gathering card database with rulings, printings, and prices. Tools include search cards, get card, get rulings Published from a private commercial monorepo. Not affiliated with or endorsed by Scryfall.

## Setup Requirements
- No configuration required. Works out of the box with no API keys.

## Category
Games

## Features

- Search cards: Search Magic: The Gathering cards by Scryfall syntax — card name, oracle text, color, type, e.g. 'c:red type:dragon', 'o:\"when ~ enters\" legendary creature'.
- Get card: Get a single card by fuzzy name (e.g. 'bolas citadel' → Bolas's Citadel).
- Get rulings: Get official Gatherer rulings for a card by fuzzy name.
- List sets: List recent Magic sets with release dates and card counts.
- Random card: Get one random Magic card — good for deck ideas, cube picks and discovery.
- Set cards: List the cards in one Magic set by set code, e.g. 'dmu', 'blb', 'mh3'.
- Card price: Current market prices for a card across TCGplayer (USD, foil and non-foil), Cardmarket (EUR) and MTGO (tix).
- Resolve a list of cards: Resolve up to 75 card names in one request and report the total price plus any name that did not match, so a decklist is checked in one call.
- Card by set and number: Fetch one exact printing by set code and collector number, e.g. lea 233 - the reliable way to a specific printing rather than a search result.
- Mana symbols: Scryfall's symbology: every mana and counter symbol with its meaning, mana value and the SVG file, optionally filtered by symbol or wording.
- Complete a card name: Turn a partial or misspelled card name into the real names Scryfall knows, for use in a search that would otherwise come back empty.

## Getting Started

- "Ask your assistant about scryfall using this server once installed"
- Tool: search_cards — Search Magic: The Gathering cards by Scryfall syntax — card name, oracle text, color, type, e.g. 'c:red type:dragon', 'o:\"when ~ enters\" legendary creature'.
- Tool: get_card — Get a single card by fuzzy name (e.g. 'bolas citadel' → Bolas's Citadel).
- Tool: get_rulings — Get official Gatherer rulings for a card by fuzzy name.
- Tool: list_sets — List recent Magic sets with release dates and card counts.
- Tool: random_card — Get one random Magic card — good for deck ideas, cube picks and discovery.
- Tool: set_cards — List the cards in one Magic set by set code, e.g. 'dmu', 'blb', 'mh3'.
- Tool: card_price — Current market prices for a card across TCGplayer (USD, foil and non-foil), Cardmarket (EUR) and MTGO (tix).
- Tool: cards_by_collection — Resolve up to 75 card names in one request and report the total price plus any name that did not match, so a decklist is checked in one call.
- Tool: card_by_set_number — Fetch one exact printing by set code and collector number, e.g. lea 233 - the reliable way to a specific printing rather than a search result.
- Tool: mana_symbols — Scryfall's symbology: every mana and counter symbol with its meaning, mana value and the SVG file, optionally filtered by symbol or wording.
- Tool: card_autocomplete — Turn a partial or misspelled card name into the real names Scryfall knows, for use in a search that would otherwise come back empty.

## Tags
scryfall, mcp, shopping, keyless

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/scryfall-mcp
