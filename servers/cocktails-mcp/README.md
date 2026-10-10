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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `filter_cocktails`
* `shopping_list`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
