# Documenso MCP

MCP server for Documenso: documents, recipients. Works with any instance.

## Setup

```bash
export DOCUMENSO_URL=https://app.documenso.com
export DOCUMENSO_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_documents`: Titles and statuses.
- `get_document`: Recipients with signing states.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance. All tools are read-only.


