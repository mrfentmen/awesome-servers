# secret-hygiene-mcp

Secret Hygiene scans bounded local files for common secret-like patterns and returns category counts only. It is designed as a pre-commit review signal, not a credential detector with perfect coverage.

## Quick start

```bash
npm install
npm test
npm start
```

Use `scan_secret_hygiene` inside `SECRET_HYGIENE_ROOT`.

## Privacy and limits

Values, keys, matches, filenames, paths, and source text are never returned. Pattern matching is conservative and can produce false positives or miss unusual formats. Rotate exposed credentials separately.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
