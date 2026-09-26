# paypal-mcp

Query PayPal sandbox (set PAYPAL_SANDBOX_CLIENT_ID + PAYPAL_SANDBOX_SECRET, OAuth auto-token): orders, captures, billing plans. Sandbox only.

## Tools

- `get_order` — One order by id, with status, amount and payer.
- `get_capture` — One payment capture by id, with amount and status.
- `list_plans` — Billing plans on the account, with id and status.

## Source

[paypal-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/paypal-mcp)
