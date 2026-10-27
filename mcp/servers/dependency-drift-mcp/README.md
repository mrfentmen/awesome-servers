# dependency-drift-mcp

Dependency Drift is a small, read-only MCP server for a common release problem: the dependency manifest and the lockfile stop telling the same story.

It scans a bounded local project and reports aggregate signals such as which package manager families are present, whether a lockfile is missing, whether lockfile formats disagree, and how many declared or locked entries were seen. It does not install anything and it does not try to fix the project for you.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio and works with Claude Desktop, Cursor, VS Code, MCP Inspector, and other compatible MCP clients.

## Tool

### `inspect_dependency_drift`

Input:

```json
{"project":"/path/to/project"}
```

The project path must be inside `DEPENDENCY_DRIFT_ROOT`. When the variable is not set, the server uses the parent of the current working directory as its default boundary, so set the variable explicitly when running from a larger workspace.

The response contains counts for recognized manifests and lockfiles, package manager categories, declared and locked entry totals, missing or orphaned lockfile signals, and coarse format markers.

## Privacy and limits

Dependency names, versions, paths, source text, commands, environment values, and URLs are not returned. The scanner reads only recognized manifest and lockfile filenames, skips dependency and build directories, and applies depth, file count, and file size limits.

This is a release hygiene signal, not a package vulnerability scanner, dependency resolver, or automatic upgrade tool. A `review` result means the project deserves a closer look. It is not proof that the project is broken.

## Test

```bash
npm test
npm run build
```
