# NuGet MCP

.NET package metadata and versions from the NuGet registry. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nuget-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nuget-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nuget-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_package` | Metadata and versions for a .NET package |

## Notes

Package ids are case sensitive in the catalog. Versions are ordered oldest first; the last entry is usually the latest stable release.

## Licence

MIT
