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
