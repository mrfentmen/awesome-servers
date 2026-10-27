# crates-io-mcp

Rust crates from crates.io: search, download trends, version history, owners, dependency lists.

Data source: https://crates.io/api/v1 (no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_crates` | Keyword search with download counts and sort options. |
| `crate_info` | Downloads, latest version, repo, keywords and categories. |
| `crate_versions` | Release history with dates, downloads and yanked flags. |
| `crate_owners` | Current maintainers of a crate. |
| `crate_dependencies` | Normal, build and dev requirements for a version. |
| `download_trend` | Day-by-day download totals, newest first. |

## Install

```bash
npx -y crates-io-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "crates-io-mcp": { "command": "npx", "args": ["-y", "crates-io-mcp"] }
  }
}
```

## Example prompts

- is serde still growing
- what does tokio depend on

## Notes

Responses are plain text, trimmed to the fields that matter. Failures come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
