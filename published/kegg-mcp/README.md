# KEGG

Search KEGG genes and compounds, read entries and list their pathways - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/kegg-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "kegg-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/kegg-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_genes` | Find genes by symbol or keyword across KEGG organisms. |
| `get_kegg_entry` | Read a KEGG entry record such as hsa:7157, C00031 or hsa04115. |
| `pathways_for_entry` | List the KEGG pathways linked to a gene or compound. |
| `search_compounds` | Find chemical compounds by name or formula fragment. |

## Data source

KEGG REST API
