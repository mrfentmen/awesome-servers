# rollbar-mcp

Query the Rollbar API (free tier token; set ROLLBAR_ACCESS_TOKEN, query param): projects, project items, item details.

## Tools

- `list_projects` — Rollbar projects the token can read.
- `list_items` — Error items in one project, most recent first.
- `get_item` — One error item by id, with occurrences and stack.

## Source

[rollbar-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/rollbar-mcp)
