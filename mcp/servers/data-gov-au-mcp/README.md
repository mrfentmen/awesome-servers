# data.gov.au MCP

Search Australian government open datasets. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/data-gov-au-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "data-gov-au-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/data-gov-au-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `datasets` | Search Australian government datasets |

## Notes

data.gov.au runs on CKAN, so this searches the national catalogue of Australian government datasets.

## Licence

MIT
