# ietf-mcp

A focused MCP interface to the IETF Datatracker for protocol research, RFC lookup, Internet-Draft discovery, working-group context, and meeting history.

## Tools

- `search_documents`: search RFCs and Internet-Drafts by name or query.
- `get_document`: look up a document by name such as `rfc9110`.
- `search_working_groups`: find IETF working groups by name.
- `list_recent_meetings`: list recent public IETF meetings.

The server is read-only, keyless, and uses the public Datatracker API. It returns metadata and public records; it does not submit drafts, edit working-group records, or perform standards actions.

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

- `search_documents`: Find IETF documents using the Datatracker name filter, with bounded pagination.
- `get_document`: Look up an IETF document by name, such as rfc9110 or draft-ietf-httpbis.
- `search_working_groups`: Search IETF working groups by name.
- `list_recent_meetings`: List recent IETF meetings from the public Datatracker.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_documents`.


