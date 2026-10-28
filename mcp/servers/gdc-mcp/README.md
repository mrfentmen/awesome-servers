# GDC Cancer Data

NCI Genomic Data Commons: browse TCGA and other cancer projects, read one project in full and look genes up - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/gdc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "gdc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/gdc-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_projects` | GDC cancer projects (TCGA, TARGET, CPTAC and others), optionally filtered by a keyword. |
| `project_detail` | One GDC project in full: name, disease type, primary site, program and summary. |
| `find_genes` | Look genes up in the GDC gene index by symbol: id, biotype, cytoband and canonical transcript length. |

## Data source

NCI Genomic Data Commons API (api.gdc.cancer.gov), no key required
