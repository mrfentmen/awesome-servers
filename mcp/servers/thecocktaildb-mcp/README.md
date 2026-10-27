# TheCocktailDB MCP

TheCocktailDB: search 600+ cocktails, full recipes with measures and steps, browse by letter — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y thecocktaildb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "thecocktaildb-mcp": { "command": "npx", "args": ["-y", "thecocktaildb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_cocktails` | Find cocktails by name |
| `cocktail_detail` | Ingredients, measures, steps and image |
| `random_cocktail` | One random recipe |
| `browse_by_letter` | List drinks starting with one letter |
| `list_ingredients` | Ingredient names the free tier exposes |
| `list_filters` | Every category, glass and strength label |

## Example

```
Cocktails matching "margarita" (6):

1. Margarita (11007)
   Ordinary Drink · Alcoholic · Cocktail glass · IBA
```

## Notes

Uses TheCocktailDB's public test key. Its free tier caps filtered lists (by ingredient or category) at a single drink, so this server does not offer them — use search or letter browse instead.

## Licence

MIT
