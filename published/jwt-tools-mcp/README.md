# JWT Tools MCP

Decode and verify JSON Web Tokens on the local machine. No network, no key, the token never leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `decode`  Decode header and payload.
* `verify`  Verify the signature.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Verification uses HMAC-SHA256 with a secret you provide. The token is processed entirely locally.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
