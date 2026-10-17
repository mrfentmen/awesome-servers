# Stardew Wiki MCP

Keyless MCP server for the Stardew Valley Wiki: search crops, villagers, quests, items, get guides and gift tastes.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_wiki`: Search crops, villagers, fish, quests, items, festivals.
- `get_page`: Full guide text for one page plus wiki link and thumbnail.
- `random_page`: Discover a random page.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


