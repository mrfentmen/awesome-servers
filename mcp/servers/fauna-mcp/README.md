# Fauna MCP

MCP server for Fauna: collections, FQL queries. Needs a database secret.

## Setup

```bash
export FAUNA_SECRET=your_secret_here
export FAUNA_URL=https://db.fauna.com  # default
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_collections`: Collection names.
- `run_query`: Any FQL v10 query (reads return data; writes run with your secret's permissions — prefer reads).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your secret stays local and goes only to Fauna.


