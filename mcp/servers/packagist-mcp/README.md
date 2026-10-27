# packagist-mcp

Packagist PHP packages: search, download stats, release history, dependency lists, popularity, registry totals.

Data source: https://packagist.org (public API, no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_packages` | Keyword search with download and faver counts. |
| `package_info` | Downloads, favers, latest release and requirements. |
| `popular_packages` | Packagist's current popular packages. |
| `package_versions` | Release history, newest first. |
| `package_dependencies` | Runtime and dev requirements of the newest release. |
| `compare_packages` | Downloads and favers side by side for two packages. |
| `registry_totals` | Whole-registry package, version and download counts. |

## Install

```bash
npx -y packagist-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "packagist-mcp": { "command": "npx", "args": ["-y", "packagist-mcp"] }
  }
}
```

## Example prompts

- is monolog still maintained
- what does guzzle require

## Notes

Responses are plain text, trimmed to the fields that matter. Errors come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
