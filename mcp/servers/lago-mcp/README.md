# lago-mcp

Query the Lago API (free self-host or cloud key; set LAGO_API_KEY, Bearer; optional LAGO_BASE_URL): plans, customers, invoices.

## Tools

- `list_plans` — Billing plans with interval and amount.
- `list_customers` — Billing customers with id and currency.
- `list_invoices` — Invoices with status, amount and billing period.

## Source

[lago-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/lago-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `invoice_arithmetic`
* `usage_bill`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-lago-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
