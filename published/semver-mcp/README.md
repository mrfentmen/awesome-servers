# Semantic Version

Semantic version toolkit: parse, compare, sort and range-check versions (npm-style ^ ~ and hyphen ranges) - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/semver-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "semver-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/semver-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_version` | Break a version into major, minor, patch, prerelease and build parts. |
| `compare_versions` | Compare two versions by semver precedence. |
| `sort_versions` | Sort a list of versions from lowest to highest. |
| `satisfies_range` | Check a version against a range: ^ ~ x-ranges, comparisons, hyphen ranges and ||. |

## Data source

Semantic versioning 2.0.0 rules, implemented locally
