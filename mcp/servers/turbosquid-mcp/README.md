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

These tools need a licence key:

* `mesh_format_survey`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
