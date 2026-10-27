# Sudoku MCP

Generate and solve Sudoku puzzles on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate`  Generate a puzzle.
* `solve`  Solve a puzzle.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Puzzles are generated and solved with a local backtracking solver. Grids use 81 digits with 0 for empty cells.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
