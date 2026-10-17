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


