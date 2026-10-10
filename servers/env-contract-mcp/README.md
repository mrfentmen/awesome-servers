# env-contract-mcp

Env Contract is a local MCP tool for finding configuration drift before a project fails at runtime. It compares variable names declared in `.env.example` and dotenv files with likely environment references in source and config files.

## Tool

- `inspect_contract`: report declared names, referenced names, missing names, unused names, and the files where they occur.

## Safety

- Reads local project files only; it never fetches URLs.
- Never reads or emits environment values. Only names and bounded file paths are returned.
- Ignores `node_modules`, build output, coverage, and Git internals.
- Caps file count, file size, recursion depth, and output.
- Matching is heuristic and is not a replacement for a build, deployment check, or secret scanner.

Set `ENV_CONTRACT_ROOT` to bound analysis to a workspace root. It defaults to the parent of the MCP package when launched normally.

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

- `inspect_contract`: Inspect a local project for declared and referenced environment variable names without reading values.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `inspect_contract`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `contract_diff`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-env-contract-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
