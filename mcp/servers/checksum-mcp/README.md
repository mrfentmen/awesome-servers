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


