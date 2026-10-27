# ebay-mcp

Query the eBay Browse API (OAuth user token; set EBAY_OAUTH_TOKEN, Bearer): item search, item details. App keys alone cannot call Browse — a user token is required.

## Tools

- `search_items` — eBay listings matching a query, with price and condition.
- `get_item` — One listing by item id, with price and seller.

- `get_item_group` — Multi-seller listing group.
- `get_legacy_item` — Lookup by legacy ID.
- `deal_items` — eBay Top Deals.
- `search_extended` — Search with full item details.
- `search_ending_soon` — Auctions ending first.
- `search_lowest_price` — Cheapest first.
- `search_newly_listed` — Newest first.
- `search_by_category` — Scoped search.

## Source

[ebay-mcp](https://github.com/mrfentmen/awesome-servers/tree/main/servers/ebay-mcp)
