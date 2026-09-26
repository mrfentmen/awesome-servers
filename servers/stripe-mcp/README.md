# stripe-mcp

Query the Stripe API (test-mode key; set STRIPE_SECRET_KEY, Basic): charges, customers, balance. Use test keys only.

## Tools

- `list_charges` — Most recent charges, with amount, currency and status.
- `list_customers` — Most recent customers, with email and created date.
- `get_balance` — Available and pending balance by currency.

## Source

[stripe-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/stripe-mcp)
