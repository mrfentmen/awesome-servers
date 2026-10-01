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

These tools need a licence key:

* `sdk_release_timeline`
* `platform_status`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
