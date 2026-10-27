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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_cards`: Search Pokémon TCG cards by name, optionally filtered by rarity.
- `get_card`: Get a single card
- `list_sets`: List Pokémon TCG sets (newest first).
- `get_set`: Get a Pokémon TCG set and its card list.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_cards`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
