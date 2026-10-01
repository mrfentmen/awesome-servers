# spreaker-mcp

Query the Spreaker podcast platform: get shows and episodes, list a show's episodes, search public shows (no key needed), and create shows with an OAuth token (SPREAKER_ACCESS_TOKEN).

## Tools

- `get_show` — Retrieve a single Spreaker show by numeric ID.
- `list_show_episodes` — List episodes of a Spreaker show.
- `get_episode` — Retrieve a single Spreaker episode by numeric ID.
- `search_shows` — Search public Spreaker shows. No API key required.
- `create_show` — Create a new Spreaker show (requires SPREAKER_ACCESS_TOKEN).

## Source

[spreaker-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/spreaker-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `publisher_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
