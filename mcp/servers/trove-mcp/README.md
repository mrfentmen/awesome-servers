# Trove MCP

MCP server for Trove: Australian books, news, images. Needs a free API key.

Pairs well with `open-library-mcp`, `gutendex-mcp`, and `loc-mcp`.

## Quick start

Get a key at https://trove.nla.gov.au/ (free), then:

```bash
export TROVE_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_records`: Books, newspapers, images and more.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Trove. Read-only.
