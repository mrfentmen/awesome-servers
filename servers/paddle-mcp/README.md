# paddle-mcp

Query the Paddle Billing API (sandbox key; set PADDLE_API_KEY, Bearer; optional PADDLE_BASE_URL for sandbox-api.paddle.com): products, product details, prices.

## Tools

- `list_products` — Paddle products with price and status.
- `get_product` — One Paddle product by id, with price and status.
- `list_prices` — Prices, optionally for one product.

## Source

[paddle-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/paddle-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `convert_amount`
* `fx_rate_history`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-paddle-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
