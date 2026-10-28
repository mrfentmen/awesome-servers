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
