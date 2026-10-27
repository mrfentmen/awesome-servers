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
