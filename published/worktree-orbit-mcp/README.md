# worktree-orbit-mcp

Worktree Orbit is a local MCP for developers who keep several Git worktrees alive at once. It answers whether a repository has parallel worktrees, whether they are clean, and whether detached, locked, or prunable worktrees need attention.

## Tool

- `inspect_worktree_topology`: returns aggregate worktree count, primary and linked counts, clean or dirty counts, detached state, lock state, prunable state, and a coarse topology hint.

It never returns paths, branch names, hashes, remotes, lock reasons, subjects, authors, or file contents.

## Safety

- Local Git commands only. No network access is used.
- The selected repository must stay inside `WORKTREE_ORBIT_ROOT`.
- Commands are read-only: the server does not add, remove, move, lock, unlock, reset, prune, or modify worktrees.
- Worktree status checks are bounded and time limited.
- Results are aggregate signals, not a replacement for inspecting a specific worktree before deleting it.

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

- `inspect_worktree_topology`: Summarize local Git worktree topology, clean or dirty state, detached worktrees, locks, and prunable entries without exposing paths, branch names, hashes, remotes, or content.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `inspect_worktree_topology`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
