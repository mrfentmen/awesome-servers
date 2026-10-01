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

These tools need a licence key:

* `bank_health`
* `banks_by_state`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
