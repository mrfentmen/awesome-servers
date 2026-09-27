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
