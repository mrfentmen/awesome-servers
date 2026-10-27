# docspell-mcp

Query the Docspell document management REST API: server version (public), full-text item search, and item details. Works with any Docspell server via `DOCSPELL_BASE_URL` (default http://localhost:7880); search/detail need `DOCSPELL_AUTH_TOKEN` (from POST /open/auth/login, header X-Docspell-Auth).

## Setup

Point at your Docspell server. The version tool is public; search and item detail need a token from `POST /open/auth/login`.

```bash
# optional, defaults to http://localhost:7880
export DOCSPELL_BASE_URL=http://localhost:7880
export DOCSPELL_AUTH_TOKEN=your_token
npm install
npm run build
node dist/index.js
```

## Tools

- `get_version` — Docspell server version info. Public, no auth needed.
- `search_items` — Full-text document search (requires DOCSPELL_AUTH_TOKEN).
- `get_item` — Document item details by ID (requires DOCSPELL_AUTH_TOKEN).

## Source

[docspell-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/docspell-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
