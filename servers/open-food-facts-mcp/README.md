# open-food-facts-mcp

Look up packaged food products when an agent needs ingredient, allergen, or nutrition context. This is useful for pantry tools, recipe assistants, accessibility workflows, and barcode experiments.

## Tools

- `get_product`: retrieve a product by barcode.
- `search_products`: search products by text with a deliberately small result set.

Open Food Facts is community contributed. Missing or incorrect fields are possible, and nutrition or allergen data should not replace professional dietary or medical advice. The server sends a descriptive User-Agent and needs no key.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_product`: Look up a food product by barcode, ingredients, allergens, and nutrition.
- `search_products`: Search Open Food Facts products by text. Results are intentionally small to respect the public service.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_product`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `ingredient_search`
* `tag_search`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
