# ClinVar

ClinVar variant interpretations from NCBI: search variants by gene or condition and read classifications - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/clinvar-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "clinvar-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/clinvar-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_variants` | Search ClinVar variants by gene, condition or HGVS text. |
| `variant_detail` | One ClinVar record: classification, review status, traits and location. |

## Data source

NCBI Entrez E-utilities (ClinVar, db=clinvar)
