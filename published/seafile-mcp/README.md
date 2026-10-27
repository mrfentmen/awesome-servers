# seafile-mcp

Query the Seafile Web API: list libraries, library info, default library, and file details. Works with any Seafile server via `SEAFILE_BASE_URL` (default https://cloud.seafile.com) and `SEAFILE_API_TOKEN` (from POST /api2/auth-token/).

## Setup

Get an API token from your Seafile server (`POST /api2/auth-token/`), then:

```bash
export SEAFILE_API_TOKEN=your_token
# optional, defaults to https://cloud.seafile.com
export SEAFILE_BASE_URL=https://cloud.seafile.com
npm install
npm run build
node dist/index.js
```

The token goes to your Seafile server and nowhere else.

## Tools

- `list_libraries` — All libraries the token can access.
- `get_library_info` — Seafile library metadata.
- `get_default_library` — The account default library.
- `get_file_detail` — Metadata of a file in a library.

## Source

[seafile-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/seafile-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
