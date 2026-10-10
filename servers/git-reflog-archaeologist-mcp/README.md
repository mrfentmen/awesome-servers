# git-reflog-archaeologist-mcp

Git Reflog Archaeologist is a local MCP for the moment after an accidental reset, deleted branch, or abandoned experiment. It looks at Git metadata that can help answer whether recovery may still be possible.

## Tools

- `reflog_signals`: aggregate reflog count, age buckets, and loose or packed object counts
- `recovery_signals`: aggregate unreachable object counts by type
- `stash_signals`: aggregate stash count and age buckets

The outputs include coarse recovery hints such as `recent-history-may-be-recoverable` or `unreachable-commits-found`. They do not return commit hashes, subjects, ref names, file paths, remote names, author data, or file contents.

## Safety

- Local Git commands only. No network access is used.
- The selected repository must stay inside `GIT_ARCHAEOLOGY_ROOT`.
- Git output is line and count bounded.
- The server never runs mutating commands such as reset, reflog expire, prune, or garbage collection.
- This is a recovery signal tool, not a guarantee that an object can be restored.

## Run

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio and works with Claude Desktop, Cursor, VS Code, MCP Inspector, and compatible CLI harnesses.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `reflog_signals`: Summarize local reflog activity by count and age bucket without returning ref names, hashes, subjects, paths, or remotes.
- `recovery_signals`: Count unreachable Git object types and recovery hints without returning object IDs, messages, paths, or contents.
- `stash_signals`: Summarize local stash age buckets and count without returning stash messages, refs, hashes, or paths.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `reflog_signals`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `reflog_activity_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-git-reflog-archaeologist-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
