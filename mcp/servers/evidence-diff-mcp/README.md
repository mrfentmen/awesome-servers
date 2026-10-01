# evidence-diff-mcp

Evidence Diff is a local MCP tool for explaining coarse changes in a Git project’s test and build evidence. It can tell an agent that a worktree changed, that uncommitted evidence exists, or that test-like artifacts appear without build-like artifacts, without exposing source diffs.

## Tool

- `explain_change_evidence`: inspect local Git state and bounded top-level evidence names.

## Safety

- Local paths only, bounded by `EVIDENCE_DIFF_ROOT` and realpath checks.
- Returns only counts, coarse categories, coarse branch state, and commit dates.
- Never returns source diffs, evidence filenames, branch names, file paths from Git output, commit subjects, authors, command output, file contents, or secrets.
- Does not execute tests, builds, or arbitrary project commands.
- This is an evidence explanation aid, not a code review or CI oracle.

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

- `explain_change_evidence`: Explain coarse changes in local Git and test-build evidence without returning source diffs, file contents, or secrets.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `explain_change_evidence`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `commit_history_evidence`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-evidence-diff-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
