# lemonsqueezy-mcp

Query the Lemon Squeezy API (test-mode key; set LEMONSQUEEZY_API_KEY, Bearer): stores, products, product details.

## Tools

- `list_stores` — Lemon Squeezy stores on the account.
- `list_products` — Products, optionally for one store.
- `get_product` — One product by id, with price and variants.

## Source

[lemonsqueezy-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/lemonsqueezy-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `fee_breakdown`
* `payout_schedule`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
