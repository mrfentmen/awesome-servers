# plaid-mcp

Query Plaid sandbox (set PLAID_CLIENT_ID + PLAID_SECRET): institutions, categories, sandbox public tokens. Sandbox only.

## Tools

- `list_institutions` — Sandbox banks available for testing.
- `list_categories` — Personal finance categories Plaid can return.
- `sandbox_token` — Create a test public token (sandbox only).

- `get_institution` — By ID.
- `sandbox_balance` — Needs sandbox access token.
- `sandbox_transactions` — Needs sandbox access token.
- `sandbox_holdings` — Investment holdings.
- `sandbox_liabilities` — Loans/credit.
- `sandbox_auth` — Account/routing.
- `sandbox_identity` — Account holder.

## Source

[plaid-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/plaid-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `bank_health`
* `banks_by_state`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-plaid-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
