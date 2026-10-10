# Spoonacular MCP

MCP server for Spoonacular: recipes, ingredients, nutrition. Free key.

Pairs well with `themealdb-mcp`, `cocktails-mcp`, and `open-food-facts-mcp`.

## Setup

Get a key at https://spoonacular.com/food-api/ (free, 150 calls/day), then:

```bash
export SPOONACULAR_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_recipes`: Times and servings.
- `get_recipe`: Ingredients and steps.
- `guess_nutrition`: Calories and macros for a dish name.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Spoonacular. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `product_search`
* `barcode_lookup`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-spoonacular-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
