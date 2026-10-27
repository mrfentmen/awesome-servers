# ORCID

Search ORCID researcher profiles, read affiliations and list published works - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/orcid-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "orcid-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/orcid-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_researchers` | Find researchers by name, keyword or institution. |
| `get_researcher` | Read a researcher profile and their current affiliations. |
| `list_works` | List works on an ORCID record with title, year, type and DOI. |

## Data source

ORCID public API v3.0
