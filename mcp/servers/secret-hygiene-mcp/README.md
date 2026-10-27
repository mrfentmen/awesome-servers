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
