# odysee-mcp

Keyless Odysee video search via Lighthouse: keyword and channel search with claim ids.

## Setup

No API key needed.

## Tools

- `search_claims` — Search Odysee videos by keyword: claim ids, titles, channels, durations.
- `search_channel` — Recent Odysee uploads from one channel handle, e.g. '@NASA'.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `video_details`
* `channel_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-odysee-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
