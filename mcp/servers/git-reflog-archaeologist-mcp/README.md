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
