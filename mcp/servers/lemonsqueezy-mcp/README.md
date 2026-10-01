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

These tools need a license key:

* `fee_breakdown`
* `payout_schedule`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-lemonsqueezy-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
