# teedy-mcp

Query the Teedy (Sismics Docs) document management REST API: login, list documents, document details, and file lists. Works with any Teedy server via `TEEDY_BASE_URL` (default https://demo.teedy.io); authenticated calls use `TEEDY_AUTH_TOKEN` (auth_token cookie value from login).

## Tools

- `login` — Log in with username/password; returns the auth_token to set as TEEDY_AUTH_TOKEN.
- `list_documents` — Documents in the Teedy inbox/library (requires TEEDY_AUTH_TOKEN).
- `get_document` — Teedy document metadata by ID (requires TEEDY_AUTH_TOKEN).
- `list_document_files` — Files attached to a document (requires TEEDY_AUTH_TOKEN).

## Source

[teedy-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/teedy-mcp)
