# CERN MCP

Keyless MCP server for CERN Open Data: records, datasets, software, news.

Pairs well with `arxiv-mcp`, `biorxiv-mcp`, and `figshare-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_records`: Datasets, software, news, glossary.
- `get_record`: Abstract, type, files, link.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


