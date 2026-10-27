# schema-compatibility-mcp

Schema Compatibility compares bounded JSON type fingerprints. It highlights broad type-count changes without exposing property names, values, or schema text. It is not semantic schema compatibility validation.

## Quick start

```bash
npm install
npm test
npm start
```

Use `compare_schema_shapes` with two JSON files inside `SCHEMA_COMPATIBILITY_ROOT`.

## Limits

This is a shape signal, not semantic schema validation. The response contains aggregate type counts only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
