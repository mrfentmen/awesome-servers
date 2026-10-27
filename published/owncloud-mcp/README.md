# owncloud-mcp

Query the ownCloud OCS API: server capabilities and file/folder shares (list, info, create public/user/group links). Works with any ownCloud server via `OWNCLOUD_BASE_URL` (default https://demo.owncloud.com); authenticated calls use `OWNCLOUD_USERNAME`/`OWNCLOUD_PASSWORD` (Basic auth).

## Tools

- `get_capabilities` — ownCloud server capabilities. Public on most servers.
- `list_shares` — All file/folder shares (requires login).
- `get_share` — Share details by ID (requires login).
- `create_share` — Share a file/folder: 0=user 1=group 3=public link (requires login).

## Source

[owncloud-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/owncloud-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
