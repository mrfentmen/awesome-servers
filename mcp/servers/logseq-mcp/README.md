# Logseq MCP

MCP server for Logseq: graphs, pages, blocks via the local HTTP API plugin.

## Setup

1. In Logseq, install the **HTTP APIs** plugin and note its port (default 12315).
2. Then:

```bash
export LOGSEQ_URL=http://localhost:12315
export LOGSEQ_API_TOKEN=token_if_configured
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_pages`: All pages.
- `get_page`: One page with its block outline.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Everything stays on your machine.
