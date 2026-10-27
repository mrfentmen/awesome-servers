# ICD-10-CM

Search and validate ICD-10-CM diagnosis codes from the US NLM clinical tables - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/icd10-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "icd10-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/icd10-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_icd10` | Search ICD-10-CM codes by disease name or keyword. |
| `lookup_icd10_code` | Look up the exact meaning and validity of an ICD-10-CM code. |
| `browse_icd10_prefix` | List codes under a chapter or category prefix. |

## Data source

US National Library of Medicine Clinical Tables API
