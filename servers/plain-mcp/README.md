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

These tools need a license key:

* `email_deliverability`
* `response_time_report`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-plain-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
