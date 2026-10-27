# build-cache-mcp

Build Cache summarizes local build and cache footprint. It helps explain why a workspace is slow or large without exposing filenames or contents.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_build_cache` with a local project path.

## Privacy and limits

Only file metadata inside recognized artifact directories is read. The response contains aggregate size and age buckets, directory counts, and file counts. It does not return paths, names, contents, or dependency data. Recursion, file count, file size, and total byte limits prevent unbounded scans.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
