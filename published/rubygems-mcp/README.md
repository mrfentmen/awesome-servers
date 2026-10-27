# rubygems-mcp

RubyGems registry: search, gem stats, release history, newest releases, dependents, owners.

Data source: https://rubygems.org/api/v1 (no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_gems` | Keyword search with download counts. |
| `gem_info` | Downloads, authors, license and project links. |
| `gem_versions` | Release history, newest first. |
| `latest_releases` | Gems published most recently. |
| `reverse_dependencies` | Gems that depend on the given gem. |
| `gem_owners` | Current owners of a gem. |

## Install

```bash
npx -y rubygems-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "rubygems-mcp": { "command": "npx", "args": ["-y", "rubygems-mcp"] }
  }
}
```

## Example prompts

- who maintains railties
- what depends on rake

## Notes

Responses are plain text, trimmed to the fields that matter. Failures come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
