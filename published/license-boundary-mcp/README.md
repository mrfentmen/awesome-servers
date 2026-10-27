# license-boundary-mcp

License Boundary summarizes local license evidence before a release. It classifies common license markers and highlights unknown evidence without pretending to provide legal advice.

## Quick start

```bash
npm install
npm test
npm start
```

Call `inspect_license_boundary` with a bounded project path.

## Privacy and limits

The server reads license files and recognized manifests, but only returns aggregate categories. It never returns license text, package names, paths, or source. Classification is intentionally conservative.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
