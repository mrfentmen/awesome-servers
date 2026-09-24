# scryfall mcp

MCP server for **Scryfall**, the definitive Magic: The Gathering card database.

## Tools

| Tool | What it does |
|---|---|
| `search_cards` | Full Scryfall syntax search (`c:red type:dragon`, `o:"when ~ enters"`) |
| `get_card` | Fuzzy name card lookup (Bolas's Citadel, Chaos Orb…) |
| `get_rulings` | Official Gatherer rulings |
| `list_sets` | Recent sets with release dates + card counts |

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

## Tools at a glance

- `search_cards`: Search Magic: The Gathering cards by Scryfall syntax - card name,
- `get_card`: Get a single card by fuzzy name (e.g.
- `get_rulings`: Get official Gatherer rulings for a card by fuzzy name.
- `list_sets`: List recent Magic sets with release dates and card counts.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_cards`.
