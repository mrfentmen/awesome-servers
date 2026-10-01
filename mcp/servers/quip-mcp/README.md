# quip-mcp

Quip Automation API: thread search, thread content, folders. Needs token.

## Setup

```bash
export QUIP_API_TOKEN=...
```

## Tools

- `search_threads` — Search Quip docs, spreadsheets and chats by text.
- `get_thread` — Quip thread with document HTML content.
- `list_folders` — Quip folders including shared folders.
- `get_user` — Authenticated Quip user profile.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `wiki_article`
* `wiki_outline`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
