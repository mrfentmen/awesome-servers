# notion-mcp

Query Notion (integration token; set NOTION_API_KEY, Bearer + version header): search, users, page details.

## Tools

- `search` — Pages and databases the integration can reach, by title.
- `list_users` — Users in the Notion workspace, with id, name and type.
- `get_page` — Properties of one page, by the page id.

- `query_database` — Rows of a database.
- `block_children` — Children blocks.
- `search_databases` — Databases by query.
- `get_user` — User details.
- `append_block` — Add a REAL paragraph.
- `update_page_title` — Set a REAL title.
- `create_page` — Create a REAL subpage.

## Source

[notion-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/notion-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `notion_page_metadata`
* `notion_id_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-notion-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
