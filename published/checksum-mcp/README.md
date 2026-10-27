# Checksum MCP

Compute sha256, sha1, and md5 checksums for text and local files. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `hash_text`  Hash a string.
* `hash_file`  Hash a local file.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Hashing runs locally with the built in crypto module.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
