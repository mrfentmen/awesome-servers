# Pathway Commons

Pathway Commons integrated graph search: find pathways, proteins and other entities by name across many databases - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/pathway-commons-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "pathway-commons-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/pathway-commons-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_terms` | Search every entity type (pathway, protein, complex and more) by name or keyword. |
| `find_pathways` | Search only pathways by name and list where each one comes from (Reactome, KEGG and others). |
| `search_proteins` | Search only proteins and protein families by name. |

## Data source

Pathway Commons v2 search service (www.pathwaycommons.org/pc2), no key required
