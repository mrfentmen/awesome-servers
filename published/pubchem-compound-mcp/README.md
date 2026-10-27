# PubChem

PubChem compounds: properties by name or CID, synonyms, and a short description - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/pubchem-compound-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "pubchem-compound-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/pubchem-compound-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `compound_properties` | Key properties for a compound by name or CID. |
| `compound_synonyms` | Synonyms and trade names listed for a compound. |
| `compound_description` | PubChem's short written description of a compound. |

## Data source

PubChem PUG REST (NIH)
