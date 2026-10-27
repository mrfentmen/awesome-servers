# federal-register-mcp

Search the official Federal Register API for rules, proposed rules, notices, presidential documents, agencies, and document metadata.

## Tools

- `search_documents`: search by term, document type, publication date range, and page.
- `get_document`: retrieve one document by document number.
- `list_agencies`: list agencies represented by the API.

The server is read-only and keyless. Federal Register publication is not the same as legal advice or proof that a rule is currently in force. Check the linked official document and effective dates before acting.

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

- `search_documents`: Search public Federal Register rules, notices, proposed rules, and presidential documents.
- `get_document`: Get one Federal Register document by document number.
- `list_agencies`: List agencies represented in the Federal Register API.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_documents`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
