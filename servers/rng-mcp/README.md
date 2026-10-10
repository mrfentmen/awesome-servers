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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `random_fact`
* `random_advice`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-rng-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
