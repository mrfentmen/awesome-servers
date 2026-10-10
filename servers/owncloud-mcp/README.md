# owncloud-mcp

Query the ownCloud OCS API: server capabilities and file/folder shares (list, info, create public/user/group links). Works with any ownCloud server via `OWNCLOUD_BASE_URL` (default https://demo.owncloud.com); authenticated calls use `OWNCLOUD_USERNAME`/`OWNCLOUD_PASSWORD` (Basic auth).

## Tools

- `get_capabilities` — ownCloud server capabilities. Public on most servers.
- `list_shares` — All file/folder shares (requires login).
- `get_share` — Share details by ID (requires login).
- `create_share` — Share a file/folder: 0=user 1=group 3=public link (requires login).

## Source

[owncloud-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/owncloud-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `server_status`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-owncloud-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
