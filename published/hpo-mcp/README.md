# Human Phenotype Ontology

Search HPO phenotype terms, read definitions and explore the phenotype hierarchy - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hpo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hpo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hpo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_phenotypes` | Search phenotype terms by name or definition. |
| `phenotype_term` | Read one HPO term with definition, synonyms and parents. |
| `phenotype_children` | More specific phenotypes below a term. |

## Data source

HPO public API (Jackson Laboratory)
