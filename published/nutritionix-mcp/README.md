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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
