# MetaboLights

EBI MetaboLights metabolomics studies: search public studies and read study detail with organisms - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/metabolights-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "metabolights-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/metabolights-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_studies` | Public MetaboLights studies, optionally filtered by a keyword matched against the identifier, title or description. |
| `study_detail` | One MetaboLights study in full: title, description, status, organisms, technologies and dates. |
| `study_design` | Study design descriptors, experimental factors and measurement technologies for one study. |

## Data source

EBI MetaboLights web service (www.ebi.ac.uk/metabolights/ws), no key required
