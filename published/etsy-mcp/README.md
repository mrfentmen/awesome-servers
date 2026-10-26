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

- `find_shop`: Find Etsy shops by name: rating, listings count, URL.
- `shop_listings`: Active listings of an Etsy shop: titles, prices, quantities, links.
- `get_listing`: One Etsy listing: title, price, quantity, link, image.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Etsy's API. All tools are read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
