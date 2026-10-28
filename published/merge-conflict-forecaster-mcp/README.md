# merge-conflict-forecaster-mcp

Merge Conflict Forecaster estimates where several local branches are likely to collide before anyone starts a merge.

It reads local Git branch topology and compares each branch's changed-file set with the other analyzed branches. It returns aggregate overlap pressure rather than source content.

## Tool

### `forecast_merge_conflicts`

Arguments:

- `cwd`: local Git repository path inside `MERGE_CONFLICT_FORECASTER_ROOT`; defaults to `.`
- `base`: optional existing local branch used as the comparison base; defaults to the current branch, or `HEAD` when detached
- `limit`: maximum number of local branches to inspect, from 1 to 40, default 20

The forecast categories are:

- `no-observed-file-overlap`
- `low-overlap-pressure`
- `medium-overlap-pressure`
- `high-overlap-pressure`

The tool uses real `git branch`, `git for-each-ref`, `git diff --name-status`, and repository validation commands. It never fetches, pushes, edits, checks out, merges, or resolves a repository.

## Run

```bash
npm install
npm test
npm start
```

The server uses stdio and can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Privacy and limits

The result contains only aggregate counts, bounded pressure categories, ahead/behind counts, and branch-presence metadata. Branch names, file paths, commit messages, hashes, author identities, remotes, source contents, and secret values are suppressed. The repository path is used for access but is not returned.

This is a forecast, not a merge simulator. The selected base is always used for every candidate branch; configured upstream branches are not substituted. The base itself is excluded from candidates. A shared changed file means branches touched the same path relative to the selected base; it does not prove that Git will produce a textual conflict. Renames are treated as changed paths, and the analysis is bounded by branch, file, and output limits.

The server is local-first and does not make network requests. Set `MERGE_CONFLICT_FORECASTER_ROOT` to the workspace root that may be inspected.

## Test

```bash
npm test
```

The tests create a temporary Git repository, make two branches edit the same file, verify the real overlap forecast, check malformed and out-of-root paths, and assert that private content, paths, branch names, commit messages, and authors do not appear in the returned result.
