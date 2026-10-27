# themealdb-mcp

TheMealDB recipes, categories, and ingredient filters.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `search` — Search meals by name.
- `random` — Random meal.
- `categories` — Meal categories.
- `filterByIngredient` — Meals by ingredient.
- `searchRecipes` — Search recipes by name.
- `byIngredient` — Recipes using an ingredient.
- `recipeDetails` — Full recipe by id.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `filter_by_category`
* `filter_by_area`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-themealdb-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
