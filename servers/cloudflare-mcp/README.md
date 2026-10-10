# cloudflare-mcp

Query Cloudflare v4 (API token; set CLOUDFLARE_API_TOKEN, Bearer): zones, accounts, DNS records.

## Tools

- `list_zones` — Cloudflare zones (domains) in the account.
- `list_accounts` — Cloudflare accounts the token can reach.
- `list_dns` — DNS records in one zone id, with type and TTL.

- `zone_details` — Single zone.
- `dns_record` — Single record.
- `firewall_rules` — Zone firewall.
- `page_rules` — Zone page rules.
- `workers` — Account scripts.
- `analytics` — 24h dashboard.
- `tunnels` — Cloudflare tunnels.

## Source

[cloudflare-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/cloudflare-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `zone_settings`
* `zone_rulesets`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-cloudflare-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
