# Hex MCP

Keyless MCP server for Hex: Elixir and Erlang package versions, docs, downloads, releases.

Pairs well with `npm-search-mcp`, `pypi-mcp`, `crates-io-mcp`, and `package-registry-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_package`: Description, latest version, downloads, docs, licenses.
- `get_release`: Publish date, checksum, requirements.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
