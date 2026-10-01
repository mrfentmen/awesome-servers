# doab-mcp

Keyless Directory of Open Access Books: search open monographs and chapters.

## Setup

No API key needed.

## Tools

- `search_books` — Search DOAB open access books by keyword with handles and dates.
- `get_item` — DOAB record by handle prefix and suffix, e.g. 20.500.12854 and 170275.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `browse_directory`
* `item_metadata`
* `item_files`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
