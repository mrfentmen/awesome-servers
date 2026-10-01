# opsgenie-mcp

Query the Opsgenie API (free tier key; set OPSGENIE_API_KEY, sent as GenieKey): alerts, alert details, on-calls.

## Tools

- `list_alerts` — Open alerts, with priority, owner and created time.
- `get_alert` — One alert by id, with description and timeline.
- `list_oncalls` — Who is on call now, per rotation and schedule.

## Source

[opsgenie-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/opsgenie-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `platform_reliability`
* `incident_response_stats`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-opsgenie-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
