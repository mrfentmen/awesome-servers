# cocktaildb-mcp

Query TheCocktailDB (keyless): cocktail search, full recipes with ingredients/measures, random cocktail, and ingredient list.

## Tools

- `search_cocktails` — Find cocktails by name. Returns matching drinks with their category, glass and id — pass an id to get_cocktail for the full recipe.
- `get_cocktail` — Full recipe for one drink: ingredients with measures, instructions, glass, category and image URL. Needs a drink id from search_cocktails or filter_cocktails.
- `random_cocktail` — One or more random cocktail recipes, useful for suggestions and inspiration.
- `list_ingredients` — Known ingredients in the cocktail database, optionally filtered by a substring. Use the exact names with filter_cocktails and ingredient_info.
- `filter_cocktails` — Browse cocktails by one attribute: an ingredient they contain, a category, a glass type, or an alcohol option. Returns drink names with ids.
- `ingredient_info` — Profile of one ingredient: type, whether it contains alcohol, ABV, and a description of what it is.
- `list_filters` — The valid values for filter_cocktails: drink categories, glass types and alcohol options.
- `search_by_letter` — List every cocktail whose name starts with one letter, for browsing the database alphabetically.
- `filter_multi_ingredient` — Cocktails that contain all of the listed ingredients at once, e.g. Gin and Tonic water — the recipe finder for what is already in the bar.

## Source

[cocktaildb-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/cocktaildb-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `drink_record_audit`
* `name_variants`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
