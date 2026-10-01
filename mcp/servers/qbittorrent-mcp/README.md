# qbittorrent-mcp

Query your qBittorrent WebUI (self-hosted; set QBITTORRENT_URL + QBITTORRENT_USER + QBITTORRENT_PASS; logs in per official API docs): torrents, transfer stats, app version.

## Tools

- `list_torrents` — All torrents with progress, size and state.
- `get_transfer_info` — Global upload and download speeds.
- `get_app_version` — qBittorrent version and API version.

## Source

[qbittorrent-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/qbittorrent-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `parse_magnet`
* `torrent_geometry`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-qbittorrent-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
