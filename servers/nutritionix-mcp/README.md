# Nutritionix MCP

MCP server for Nutritionix: food search, nutrients. Needs free app keys.

Pairs well with `spoonacular-mcp`, `themealdb-mcp`, and `open-food-facts-mcp`.

## Setup

Get keys at https://developer.nutritionix.com/ (free), then:

```bash
export NUTRITIONIX_APP_ID=your_id
export NUTRITIONIX_API_KEY=your_key
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_foods`: Calories and macros.
- `analyze_meal`: Nutrients for free-text meals with totals.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Keys stay local and go only to Nutritionix. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `nutrient_food_search`
* `nutrient_food_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-nutritionix-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
