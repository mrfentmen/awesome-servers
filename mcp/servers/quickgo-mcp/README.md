# QuickGO

Gene Ontology terms, definitions, hierarchy and protein annotations via EBI QuickGO - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/quickgo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "quickgo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/quickgo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_go_term` | Definition, aspect and synonyms for a GO term. |
| `go_term_children` | Immediate child terms in the GO hierarchy. |
| `go_annotations` | Proteins annotated with a GO term. |

## Data source

EBI QuickGO API
