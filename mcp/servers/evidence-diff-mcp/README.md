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
