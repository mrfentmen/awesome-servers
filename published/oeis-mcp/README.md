# Oeis

Use this MCP server to the OEIS, the encyclopedia of integer sequences. Look up any sequence, find its name, formula, and neighbors.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_sequences`: Search the OEIS by terms or a name query. Terms like
- `get_sequence`: Get one OEIS sequence by its A number.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_sequences`.
