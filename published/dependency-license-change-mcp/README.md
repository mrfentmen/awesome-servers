# dependency-license-change-mcp

Dependency License Change compares license evidence across two local snapshots and reports category changes without exposing package names or license text.

## Quick start

```bash
npm install
npm test
npm start
```

Set `LICENSE_CHANGE_ROOT`, then call `compare_license_evidence` with `before` and `after` snapshot paths.

## Limits

Only aggregate categories and counts are returned. Classification is conservative and is not legal advice.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
