# spdx-mcp

Search the SPDX license list while reviewing dependencies, choosing project licenses, or preparing open-source notices.

## Tools

- `search_licenses`: search identifiers and license names.
- `get_license`: fetch metadata for an exact identifier such as `MIT`, `Apache-2.0`, or `GPL-3.0-only`.

This server reports SPDX metadata. It is not a legal opinion and does not perform full dependency license compatibility analysis. The public SPDX list is cached for the process lifetime.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_licenses`: Search SPDX license identifiers and names.
- `get_license`: Get SPDX metadata for an exact license identifier such as MIT, Apache-2.0, or GPL-3.0-only.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_licenses`.


