# flaky-history-mcp

Flaky History is a local MCP tool for turning small test-history exports into coarse stability signals. It accepts bounded JSON, JSONL, CSV, and simple JUnit-like XML files, then reports aggregate pass, fail, skip, and unknown counts.

## Tool

- `analyze_test_history`: aggregate local history without returning test names, file names, raw records, exact versions, or values.

## Safety

- Local paths only, bounded by `FLAKY_HISTORY_ROOT` and realpath checks.
- Reads only bounded test and result-looking JSON, JSONL, CSV, and XML files.
- Skips dependencies, build output, Git data, caches, and vendor directories.
- This is a stability signal, not a CI runner, test retry engine, or statistical proof of flakiness.

## Run

```bash
npm install
npm run build
node dist/index.js
```
