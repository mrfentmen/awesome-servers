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

These tools need a licence key:

* `public_revision_evidence`
* `public_check_evidence`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
