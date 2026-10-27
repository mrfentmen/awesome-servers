# Open Targets MCP

Keyless MCP server for Open Targets: gene/disease/drug search, target details, disease associations.

Pairs well with `mygene-mcp`, `ensembl-mcp`, `uniprot-mcp`, `clinvar-mcp`, and `reactome-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search`: Genes, diseases, drugs.
- `get_target`: Functions, known drugs, top diseases with scores.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
