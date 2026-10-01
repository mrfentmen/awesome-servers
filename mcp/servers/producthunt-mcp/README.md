# producthunt-mcp

Query Product Hunt GraphQL (token; set PRODUCTHUNT_TOKEN, Bearer): viewer, latest posts, post details.

## Tools

- `viewer` — The Product Hunt user the token belongs to.
- `list_posts` — Launches ranked by votes, with tagline and maker.

## Source

[producthunt-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/producthunt-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `show_hn_launches`
* `github_footprint`
* `competitive_scan`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
