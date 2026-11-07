# Open Government Canada MCP

Search Canadian federal open datasets on open.canada.ca. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/open-canada-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "open-canada-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/open-canada-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_datasets` | Search Canadian open datasets |

## Notes

The portal runs on CKAN. Results include the department name and the last update date.

## Licence

MIT
