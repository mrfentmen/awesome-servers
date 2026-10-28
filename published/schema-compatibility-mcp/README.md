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
