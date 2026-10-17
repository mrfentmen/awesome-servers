# Crypto Tools MCP

Hash and sign text locally with standard algorithms from the Node crypto library. No network, no key, nothing leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `hash`  Hash text.
* `hmac`  Compute an HMAC.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Hashes are computed with the Node crypto library. These tools are for checksums and verification, not for storing passwords.


