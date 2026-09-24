# turbosquid-mcp

Query the TurboSquid 3D marketplace API v1 (JSON API): list file formats, product metadata, and seller draft management. Requires `TURBOSQUID_API_TOKEN` (sent as `Authorization: Token`).

## Tools

- `list_file_formats` — 3D file formats with extensions and renderers. Public, no key needed.
- `get_product` — 3D model product metadata by numeric product ID.
- `list_drafts` — New product drafts of the authenticated member (requires TURBOSQUID_API_TOKEN).
- `get_draft` — Draft metadata by draft ID (requires TURBOSQUID_API_TOKEN).

## Source

[turbosquid-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/turbosquid-mcp)
