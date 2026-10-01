# turbosquid-mcp

Query the TurboSquid 3D marketplace API v1 (JSON API): list file formats, product metadata, and seller draft management. Requires `TURBOSQUID_API_TOKEN` (sent as `Authorization: Token`).

## Tools

- `list_file_formats` — 3D file formats with extensions and renderers (requires TURBOSQUID_API_TOKEN).
- `get_product` — 3D model product metadata by numeric product ID.
- `list_drafts` — New product drafts of the authenticated member (requires TURBOSQUID_API_TOKEN).
- `get_draft` — Draft metadata by draft ID (requires TURBOSQUID_API_TOKEN).

## Source

[turbosquid-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/turbosquid-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `mesh_format_survey`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-turbosquid-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
