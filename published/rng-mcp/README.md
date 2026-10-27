# RNG MCP

Roll dice, flip coins, and generate random integers on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `roll_dice`  Roll dice.
* `coin_flip`  Flip a coin.
* `random_number`  A random integer.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Values come from the platform random number generator. They are not suitable for cryptography.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
