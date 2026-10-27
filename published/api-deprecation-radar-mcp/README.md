# api-deprecation-radar-mcp

API Deprecation Radar counts deprecation, sunset, and obsolete markers in local API-adjacent files. It gives maintainers a quick review queue without exposing endpoint names or code.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_deprecation_radar` with a bounded local project path.

## Privacy and limits

The output contains counts and broad severity buckets only. Marker severity is heuristic and should be reviewed by a developer. No endpoint names, paths, source text, values, or filenames are emitted.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
