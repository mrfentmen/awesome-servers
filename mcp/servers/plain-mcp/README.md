# plain-mcp

Query the Plain GraphQL API (free tier key; set PLAIN_API_KEY, Bearer): customers, threads, thread details.

## Tools

- `list_customers` — Support customers with email and company.
- `list_threads` — Open support threads, newest first.
- `get_thread` — One thread by id, with messages and status.

## Source

[plain-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/plain-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `email_deliverability`
* `response_time_report`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
