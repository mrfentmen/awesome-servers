# Smithsonian MCP

MCP server for Smithsonian collections: artifacts, art, specimens. Free key.

Pairs well with `metmuseum-mcp`, `art-institute-mcp`, and `clevelandart-mcp`.

## Quick start

Get a key at https://api.data.gov/signup/ (free), then:

```bash
export SMITHSONIAN_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_objects`: Artifacts, art, specimens with images.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to the Smithsonian API. Read-only.
