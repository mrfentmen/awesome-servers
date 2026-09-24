# Etsy MCP

MCP server for Etsy shops and listings. Needs a free Etsy API key.

## Setup

Create an app at https://www.etsy.com/developers/ to get a key, then:

```bash
export ETSY_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `find_shop`: Shops by name with ratings and listing counts.
- `shop_listings`: Active listings with prices and links.
- `get_listing`: One listing with image.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Etsy's API. All tools are read-only.
