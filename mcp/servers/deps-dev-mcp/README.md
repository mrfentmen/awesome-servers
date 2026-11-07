# deps.dev MCP

Package dependency and version data across npm, PyPI, Cargo, Go and Maven. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/deps-dev-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "deps-dev-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/deps-dev-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_package` | Versions and metadata for a package |

## Notes

Systems are npm, pypi, cargo, go, maven and nuget. The response lists every version with its publish date.

## Licence

MIT
