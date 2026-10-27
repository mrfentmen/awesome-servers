# CSV MCP

Parse, inspect, and summarize CSV data locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `parse_csv`  Parse CSV into a table.
* `csv_info`  Columns and row count.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Parsing runs locally. Standard CSV quoting is supported.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
