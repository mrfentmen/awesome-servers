# figma-mcp

Query the Figma API (token; set FIGMA_ACCESS_TOKEN, X-Figma-Token): profile, file details, project files.

## Tools

- `me` — The Figma user the access token belongs to.
- `get_file` — File metadata: name, pages and last modified date.
- `project_files` — Figma files inside one project id.

- `team_projects` — Projects in a team.
- `file_comments` — Comments on a file.
- `file_versions` — Version history.
- `file_components` — Published components.
- `file_styles` — Published styles.
- `file_nodes` — Nodes by IDs.
- `file_images` — PNG renders.

## Source

[figma-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/figma-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `file_variables`
* `component_sets`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-figma-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
