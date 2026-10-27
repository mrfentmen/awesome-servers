# Name Generator MCP

Generate random names, usernames, and project codenames locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `random_name`  Random full names.
* `username`  Random usernames.
* `codename`  Random project codenames.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All names are generated locally from curated lists.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
