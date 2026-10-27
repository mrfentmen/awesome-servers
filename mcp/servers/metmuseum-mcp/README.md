# Metmuseum

Use this MCP server to the Metropolitan Museum of Art. Search 500k artworks, get details, artists, and images.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_objects`: Search the Met collection for artworks by title, artist, or keyword.
- `get_object`: Get one artwork from the Met by object id.
- `get_departments`: List all Met Museum departments.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_objects`.
