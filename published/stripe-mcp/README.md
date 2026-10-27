# stripe-mcp

Query the Stripe API (test-mode key; set STRIPE_SECRET_KEY, Basic): charges, customers, balance. Use test keys only.

## Tools

- `list_charges` — Most recent charges, with amount, currency and status.
- `list_customers` — Most recent customers, with email and created date.
- `get_balance` — Available and pending balance by currency.

- `list_invoices` — Recent invoices.
- `list_subscriptions` — Active subscriptions.
- `list_products` — Product catalog.
- `list_prices` — Price list.
- `list_refunds` — Recent refunds.
- `list_disputes` — Charge disputes.
- `list_coupons` — Coupons.

## Source

[stripe-mcp](https://github.com/mrfentmen/awesome-servers)
