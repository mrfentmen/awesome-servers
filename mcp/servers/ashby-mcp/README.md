# Ashby MCP

Keyless MCP server for Ashby job boards: openings, departments, locations.

Pairs well with `arbeitnow-mcp`, `remoteok-mcp`, and `jobicy-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_jobs`: Open roles on an Ashby-powered job board: titles, departments, locations.
- `search_jobs`: Search every open role on an Ashby job board by title, team or location.
- `get_job`: Get one Ashby role by id, including the full plain-text description.
- `list_departments`: List the teams hiring on an Ashby board, ranked by number of open roles.
- `list_remote_jobs`: List only the remote roles on an Ashby job board.
- `compensation`: List Ashby roles that publish a pay range, with the salary summary for each role.
- `list_teams`: List the sub-teams hiring on an Ashby board, ranked by number of open roles.
- `list_locations`: List every location an Ashby board hires into, including secondary locations, ranked by open roles.
- `newest_jobs`: List the most recently published roles on an Ashby board, newest first.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `posting_age`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
