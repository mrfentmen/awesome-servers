# klaviyo-mcp

Query Klaviyo (private key; set KLAVIYO_API_KEY, Klaviyo-API-Key header + revision): profiles, lists, campaigns.

## Tools

- `list_profiles` — Customer profiles with email and location.
- `list_lists` — Marketing lists with subscriber counts.
- `list_campaigns` — Klaviyo campaigns with status and send time.

- `profile_details` — Single profile.
- `list_details` — Single list.
- `campaign_details` — Single campaign.
- `metrics` — Event metrics.
- `events` — Recent events.
- `flows` — Automation flows.
- `segments` — Segments.

## Source

[klaviyo-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/klaviyo-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `disposable_check`
* `sending_readiness`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-klaviyo-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
