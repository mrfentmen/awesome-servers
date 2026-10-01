# onesignal-mcp

Query the OneSignal API (free tier; use a current v2 Organization API key for ONESIGNAL_USER_KEY and the app REST API key for ONESIGNAL_APP_KEY, Basic auth).

## Tools

- `list_apps` — OneSignal apps the key can send to.
- `get_app` — One app by id, with platform and player count.
- `list_notifications` — Recent notifications for an app.

## Source

[onesignal-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/onesignal-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `sdk_release_timeline`
* `platform_status`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-onesignal-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
