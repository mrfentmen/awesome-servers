# npm Registry

Live npm registry data - package details with weekly downloads, package search and version history, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/npm-registry-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "npm-registry-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/npm-registry-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `package_info` | Latest version of a package with description, license, dependencies, size and weekly downloads. |
| `search_packages` | Search the npm registry by keyword and rank by npm's own score. |
| `package_versions` | Version history of a package, newest first, with publish dates. |

## Data source

Live queries to registry.npmjs.org and api.npmjs.org; no key needed.
