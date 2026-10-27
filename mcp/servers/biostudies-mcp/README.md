# BioStudies

EBI BioStudies: search studies across life-science repositories and read their metadata - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/biostudies-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "biostudies-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/biostudies-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_studies` | Search BioStudies records by keyword. |
| `study_detail` | Read one BioStudies record by accession. |

## Data source

EBI BioStudies API
