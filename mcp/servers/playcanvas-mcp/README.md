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

These tools need a licence key:

* `engine_release_channels`
* `engine_release_notes`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
