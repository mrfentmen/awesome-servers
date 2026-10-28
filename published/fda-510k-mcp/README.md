# fda-510k-mcp

FDA 510(k) medical device clearances: search by device, applicant, product code or date - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/fda-510k-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "fda-510k-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/fda-510k-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_clearances` | Search 510(k) clearances by device name |
| `clearance_detail` | One 510(k) clearance by K number |
| `clearances_by_applicant` | 510(k) clearances for one company |
| `clearances_by_product_code` | 510(k) clearances under one product code |
| `clearances_by_year` | 510(k) clearances decided in a calendar year |
| `clearance_stats` | Sample counts of 510(k) decisions by advisory committee |

## Data source

openFDA 510(k) Clearances
