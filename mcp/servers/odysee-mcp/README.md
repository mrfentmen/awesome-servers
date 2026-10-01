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

These tools need a licence key:

* `video_details`
* `channel_profile`
* `recent_uploads`
* `supported_channels`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
