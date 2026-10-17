# Semver MCP

Parse, compare, and sort semantic version numbers locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `compare`  Compare two versions.
* `sort_versions`  Sort a list of versions.
* `describe`  Break a version into parts.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All parsing happens locally with the standard semantic version rules.


