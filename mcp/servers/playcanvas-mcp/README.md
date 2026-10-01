# playcanvas-mcp

Query the PlayCanvas REST API: list project assets, get asset metadata, and check API rate limits. Access token (`PLAYCANVAS_ACCESS_TOKEN`) from your Organization's Account page required.

## Tools

- `list_project_assets` — Assets in a PlayCanvas project branch.
- `get_asset` — Single PlayCanvas asset metadata.
- `get_rate_limits` — Current PlayCanvas REST API rate limits.

## Source

[playcanvas-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/playcanvas-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `engine_release_channels`
* `engine_release_notes`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-playcanvas-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
