# cBioPortal

cBioPortal cancer genomics: browse cancer types, find genes and list the public cancer studies behind them - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/cbioportal-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "cbioportal-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/cbioportal-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_cancer_types` | cBioPortal cancer types, optionally filtered by a name or id substring. |
| `find_genes` | Find genes by keyword (symbol or name) in the cBioPortal gene index. |
| `list_studies` | Public cBioPortal studies, optionally filtered by a name keyword: study id, name and cancer type. |
| `study_details` | One cBioPortal study in full: name, description, cancer type, reference and counts where given. |

## Data source

cBioPortal public API (www.cbioportal.org/api), no key required
