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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
