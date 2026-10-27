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
