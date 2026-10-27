# Password Strength MCP

Score password strength locally with the zxcvbn algorithm. No network, no key, the password never leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `check_password`  Score a password.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

zxcvbn is the same estimator used by popular password managers. The password is processed entirely on the local machine.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
