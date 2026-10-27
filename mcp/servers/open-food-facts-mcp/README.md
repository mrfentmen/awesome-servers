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
