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
