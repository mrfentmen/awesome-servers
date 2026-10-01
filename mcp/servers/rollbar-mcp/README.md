# rollbar-mcp

Query the Rollbar API (free tier token; set ROLLBAR_ACCESS_TOKEN, query param): projects, project items, item details.

## Tools

- `list_projects` — Rollbar projects the token can read.
- `list_items` — Error items in one project, most recent first.
- `get_item` — One error item by id, with occurrences and stack.

## Source

[rollbar-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/rollbar-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `dependency_audit`
* `advisory_detail`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
