# Figshare MCP

Search open research outputs published on Figshare, with DOIs and links. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/figshare-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "figshare-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/figshare-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search Figshare research outputs by keyword |

## Notes

Figshare search covers articles, datasets, figures and theses. Each hit includes its DOI when one was minted.

## Licence

MIT
