# yugioh mcp

MCP server for **YGOPRODeck**, the Yu Gi Oh! card database.

## Tools

| Tool | What it does |
|---|---|
| `search_cards` | Exact name card search (full stats, prices, banlist status) |
| `search_by_archetype` | Cards in an archetype (Blue Eyes, Branded, Dark Magician…) |
| `get_card` | Card by numeric id |
| `get_banlist` | Current TCG / OCG / GOAT forbidden & limited list, grouped by status |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
search_cards { name: "blue-eyes white dragon" }
get_banlist { format: "tcg" }
```

Keyless. Prints ATK/DEF, level/link rating, card prices (TCGplayer/Cardmarket/eBay), and TCG/OCG banlist status per card.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_cards`: Search Yu-Gi-Oh! cards by exact name.
- `search_by_archetype`: Search Yu-Gi-Oh! cards by archetype (e.g.
- `get_card`: Get a single card by numeric id (from search results).
- `get_banlist`: Get the current TCG/OCG forbidden & limited list.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_cards`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
