# godot-mcp

Query the Godot Asset Library REST API: search community addons/projects/templates with filters (Godot version, category, support, license), asset metadata with download URLs, and configuration info. Public, no API key required.

## Tools

- `search_assets` — Search the Godot Asset Library. No key needed.
- `get_asset` — Asset metadata and download URLs by ID.
- `get_configure` — Categories and login URL info.

## Source

[godot-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/godot-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `asset_categories`
* `browse_assets`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
