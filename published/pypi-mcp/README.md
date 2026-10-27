# PyPI MCP

Keyless MCP server for PyPI: Python package versions, summaries, authors, requirements, release files.

Pairs well with `npm-search-mcp`, `crates-io-mcp`, `rubygems-mcp`, and `package-registry-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_package`: Version, summary, author, license, requirements, releases.
- `get_release_files`: Wheels, sdists, sizes, download URLs.

- `version_details`
- `file_index`
- `project_links`
- `release_history`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.
