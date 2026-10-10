# mercury-mcp

Query the Mercury API (sandbox key; set MERCURY_API_KEY, Bearer): accounts, account details, transactions.

## Tools

- `list_accounts` — Mercury accounts with balance and type.
- `get_account` — One account by id, with routing details.
- `list_transactions` — Transactions on an account, newest first.

## Source

[mercury-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/mercury-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `fdic_institution_search`
* `fdic_call_report_compare`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-mercury-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
