# TheMealDB MCP

TheMealDB: recipes with full ingredient lists, numbered steps, cuisine and category filters — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/themealdb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "themealdb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/themealdb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_meals` | Find recipes by name |
| `meal_detail` | Ingredients, measures and numbered steps |
| `random_meal` | One random recipe |
| `meals_by_category` | All recipes in a category |
| `meals_by_cuisine` | All recipes from a cuisine |
| `meals_by_ingredient` | Recipes whose main ingredient you name |
| `list_options` | Every category, cuisine and ingredient |

## Example

```
Meals in "Seafood" (84):

1. Acaraje black-eyed pea fritters with shrimp filling (53483)
```

## Notes

Uses TheMealDB's public test key. Filter endpoints return names only; meal_detail adds the full list.

## Licence

MIT
