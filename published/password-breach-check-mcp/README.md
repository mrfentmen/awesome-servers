# Password Breach Check MCP

Check if a password has appeared in known data breaches using the k anonymity method. Only the first 5 characters of the hash ever leave the machine. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `check_password`  Check a password.
* `check_hash`  Check a full SHA1 hash.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Uses the Have I Been Pwned range API. The full password never leaves the machine.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
