# customerio-mcp

Query Customer.io (set CUSTOMERIO_SITE_ID + CUSTOMERIO_API_KEY, Basic): customers, customer details, segments.

## Tools

- `list_customers` — Tracked customers with email and attributes.
- `get_customer` — One customer profile by id, with its attributes.
- `list_segments` — Segments with id, name and member counts.

- `segment_details` — Single segment.
- `campaigns` — All campaigns.
- `campaign_details` — Single campaign.
- `newsletters` — All newsletters.
- `activities` — Workspace activity.
- `customer_activities` — Activity for a customer.
- `customer_messages` — Messages for a customer.

## Source

[customerio-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/customerio-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `broadcast_metrics`
* `campaign_metrics`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-customerio-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
