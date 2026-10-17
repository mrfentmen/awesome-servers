# Codewars MCP

Keyless MCP server for Codewars: user ranks, honor, kata.

Pairs well with `leetcode-mcp`, `codeforces-mcp`, and `github-intel-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_user`: Honor, rank, clan, languages.
- `get_kata`: Kata by id or slug.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


