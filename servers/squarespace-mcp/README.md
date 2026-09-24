# Squarespace MCP

MCP server for Squarespace Commerce: products, orders, inventory. Needs an API key.

## Setup

Create a key at Settings > Developer Tools > API Keys, then:

```bash
export SQUARESPACE_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_products`: Products with prices and links.
- `list_orders`: Orders with totals and customer emails.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Squarespace's API. All tools are read-only.
