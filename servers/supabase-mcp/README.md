# supabase-mcp

Query your Supabase project (set SUPABASE_URL + SUPABASE_SERVICE_KEY, apikey header): table rows, auth users, RPC. Endpoints per official docs.

## Tools

- `query_table` — Rows from one table, with select and limit applied.
- `list_users` — Auth users in the project, one page at a time.
- `call_rpc` — Call a Postgres function by name with JSON parameters.

## Source

[supabase-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/supabase-mcp)
