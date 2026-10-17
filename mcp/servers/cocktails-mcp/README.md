# Cocktails MCP

Search cocktail recipes by name or ingredient from TheCocktailDB. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_cocktails`  Search cocktails by name.
* `by_ingredient`  Cocktails by ingredient.
* `cocktail_details`  Full recipe details.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Recipe data comes from the public TheCocktailDB API.


