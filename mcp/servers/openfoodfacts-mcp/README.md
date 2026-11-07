# Open Food Facts MCP

Food product ingredients, nutrition and Nutri-Score by barcode. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/openfoodfacts-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openfoodfacts-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/openfoodfacts-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_product` | Product details for one barcode |
| `search_products` | Search food products by name |

## Notes

Barcodes are the digits printed on the package. Search uses the public cgi endpoint and returns up to 20 products.

## Licence

MIT
