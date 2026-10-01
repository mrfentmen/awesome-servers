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

These tools need a license key:

* `publisher_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-spreaker-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
