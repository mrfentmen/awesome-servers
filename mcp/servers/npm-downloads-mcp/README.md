# npm Downloads MCP

Weekly download counts for any npm package. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/npm-downloads-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "npm-downloads-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/npm-downloads-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `weekly_downloads` | Downloads in the last week |

## Notes

Packages can be scoped, e.g. @types/node. Download counts come from the npm registry's public metrics.

## Licence

MIT
