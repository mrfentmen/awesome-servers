# clinical-codes-mcp

Look up LOINC lab codes, ICD-10-CM diagnoses and condition names from the NIH Clinical Tables API - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/clinical-codes-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "clinical-codes-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/clinical-codes-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_loinc` | Search LOINC lab and clinical observation codes |
| `loinc_detail` | Look up one LOINC code |
| `search_icd10` | Search ICD-10-CM diagnosis codes |
| `icd10_detail` | Look up one ICD-10-CM code |
| `search_conditions` | Search consumer health condition names |

## Data source

NIH Clinical Tables
