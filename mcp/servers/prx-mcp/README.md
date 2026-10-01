# prx-mcp

Query the PRX public radio HAL API (feeder.prx.org): list and fetch podcasts and episodes. All public data, no API key required.

## Tools

- `list_podcasts` — PRX podcasts, paginated. No key needed.
- `get_podcast` — Single PRX podcast by ID.
- `list_episodes` — PRX episodes, paginated. No key needed.
- `get_episode` — Single PRX episode by UUID.

## Source

[prx-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/prx-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `podcasts_by_genre`
* `recent_episodes`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
