# SQL Formatter MCP

Format SQL queries into readable layouts on the local machine. No network, no key, the query never leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `format`  Format a SQL query.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Formatting uses the open source sql-formatter library and supports common dialects.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
