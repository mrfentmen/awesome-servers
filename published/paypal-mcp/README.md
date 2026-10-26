# paypal-mcp

Query PayPal sandbox (set PAYPAL_SANDBOX_CLIENT_ID + PAYPAL_SANDBOX_SECRET, OAuth auto-token): orders, captures, billing plans. Sandbox only.

## Tools

- `get_order` — One order by id, with status, amount and payer.
- `get_capture` — One payment capture by id, with amount and status.
- `list_plans` — Billing plans on the account, with id and status.

- `plan_details` — Billing plan.
- `list_products` — Catalog products.
- `product_details` — Catalog product.
- `subscription_details` — Subscription details.
- `payout_details` — Payout batch.
- `list_webhooks` — Registered webhooks.
- `dispute_details` — Customer dispute.

## Source

[paypal-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/paypal-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `payout_market_profile`
* `payout_market_scan`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-paypal-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
