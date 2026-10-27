# Open Beauty Facts

Open Beauty Facts cosmetics database: look products up by barcode, brand or search terms with ingredients - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/openbeautyfacts-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openbeautyfacts-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/openbeautyfacts-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `product_by_barcode` | One cosmetic product by its barcode, with ingredients. |
| `search_products` | Search products by name or other text. |
| `search_by_brand` | Products from one brand. |

## Data source

Open Beauty Facts (open cosmetics product database)
