# uptime-kuma-mcp

Query your Uptime Kuma instance (self-hosted; set UPTIME_KUMA_URL; optional UPTIME_KUMA_TOKEN): public status, Prometheus metrics. Endpoints per official docs.

## Tools

- `get_status` — Up/down counts per monitor in one summary.
- `get_metrics` — Raw Prometheus metrics the instance exposes.

## Source

[uptime-kuma-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/uptime-kuma-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `http_probe`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-uptime-kuma-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
