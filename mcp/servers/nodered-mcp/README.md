# Node-RED MCP

MCP server for Node-RED: flows, nodes. Works with any instance.

## Setup

```bash
export NODERED_URL=http://localhost:1880
export NODERED_TOKEN=token_if_adminauth_on
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_flows`: Flow tabs with ids.
- `get_flow`: Node count and type breakdown.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Everything stays on your network.
