# EBI Ontology Lookup

Search and read terms across hundreds of biomedical ontologies via the EBI OLS - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ols-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ols-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ols-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_ontology_terms` | Search terms across all ontologies, optionally limited to one. |
| `list_ontologies` | List loaded ontologies with their term counts. |
| `ontology_term` | Read a term from one ontology by its IRI. |

## Data source

EBI Ontology Lookup Service 4
