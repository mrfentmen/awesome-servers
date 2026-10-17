# Rebrickable MCP

MCP server for Rebrickable: LEGO sets, parts, colors. Free key.

## Setup

Get a key at https://rebrickable.com/api/ (free), then:

```bash
export REBRICKABLE_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_sets`: Sets with years and part counts.
- `get_set`: One set with link.
- `set_parts`: Inventory with colors and quantities.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Rebrickable. Read-only.


