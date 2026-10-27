# CourtListener MCP

Keyless MCP server for CourtListener: search court opinions and federal dockets (RECAP), case status, citations, judges.

Pairs well with `court-records-mcp`, `federal-register-mcp`, and `police-transparency-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_opinions`: Opinions with court, status, citations, syllabus.
- `search_dockets`: RECAP federal dockets with docket numbers.

- `search_people`
- `search_oral_args`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required for search; full opinion/docket detail endpoints need a free CourtListener API key and are not included.
