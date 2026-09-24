# BigCommerce MCP

MCP server for BigCommerce: products, orders. Needs store API credentials.

## Setup

In your store go to Settings > API > Create API Account, then:

```bash
export BC_STORE_HASH=your_store_hash
export BC_ACCESS_TOKEN=your_token
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_products`: Catalog with prices, SKUs, availability.
- `get_product`: One product by id.
- `list_orders`: Recent orders with statuses and totals.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to BigCommerce's API. All tools are read-only.
