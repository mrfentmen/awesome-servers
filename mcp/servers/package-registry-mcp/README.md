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


