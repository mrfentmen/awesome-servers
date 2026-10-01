# supabase-mcp

Query your Supabase project (set SUPABASE_URL + SUPABASE_SERVICE_KEY, apikey header): table rows, auth users, RPC. Endpoints per official docs.

## Tools

- `query_table` — Rows from one table, with select and limit applied.
- `list_users` — Auth users in the project, one page at a time.
- `call_rpc` — Call a Postgres function by name with JSON parameters.

- `storage_buckets` — All buckets.
- `storage_objects` — Files in a bucket.
- `auth_user` — User by ID.
- `create_user` — Create a REAL user.
- `delete_user` — Delete a REAL user.
- `insert_row` — Insert a REAL row.
- `update_rows` — Update a REAL row by id.
- `delete_rows` — Delete a REAL row by id.

## Source

[supabase-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/supabase-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `platform_status`
* `postgres_version_watch`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-supabase-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
