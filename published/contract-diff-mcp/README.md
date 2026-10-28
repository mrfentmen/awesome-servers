# contract-diff-mcp

Contract Diff compares two local JSON contract snapshots and reports a coarse structural fingerprint. It is useful for quickly answering whether a generated API or schema snapshot became larger, smaller, or structurally different without handing schema contents to an agent. It does not prove endpoint compatibility or identify semantic additions and removals.

## Tool

- `compare_contract_snapshots`: compare two local JSON snapshots using node counts, value type categories, and deltas only. The result is a structural signal, not a semantic contract diff.

## Safety

- Local paths only, bounded by `CONTRACT_DIFF_ROOT` and realpath checks.
- Files are capped at two megabytes and traversal is capped.
- Never returns schema names, paths, values, descriptions, examples, versions, file paths, or raw contents.
- This is a coarse regression signal, not a complete OpenAPI or JSON Schema compatibility validator.

## Run

```bash
npm install
npm run build
node dist/index.js
```
