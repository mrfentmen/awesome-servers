# repo-forensics-mcp

A local-only MCP companion for understanding a Git repository before a review, refactor, or release.

## Tools

- `repository_summary`: branch, working tree status, remotes, and latest commit metadata.
- `recent_changes`: bounded recent commit history.
- `file_hotspots`: files appearing most often in recent history.
- `top_level_hygiene`: top-level large files, `.gitignore` presence, and dirty state without reading file contents.

The server invokes local Git with fixed argument arrays. By default, paths must stay under the parent workspace of the package process; set `REPO_FORENSICS_ROOT` to an explicit workspace root when launching it. It returns remote names rather than remote URLs to avoid leaking credentials. It does not fetch, push, write files, inspect remote services, or send repository data over the network. Hotspots and hygiene are heuristics, not a complete code-quality or security audit.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `repository_summary`: Read branch, working-tree, remote names, and latest commit metadata from a local Git repository.
- `recent_changes`: List recent local Git commits with bounded output.
- `file_hotspots`: Find files that appear most often in recent repository history. This is a heuristic for review focus, not a defect detector.
- `top_level_hygiene`: Check top-level large files, .gitignore presence, and working-tree dirtiness without reading file contents.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `repository_summary`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `churn_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-repo-forensics-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
