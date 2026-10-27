# Package Registry MCP

Look up npm and PyPI packages, versions, and metadata from the public registries. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `npm_package`  npm package metadata.
* `pypi_package`  PyPI package metadata.
* `npm_search`  Search npm packages.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Metadata comes directly from the npm and PyPI registries.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
