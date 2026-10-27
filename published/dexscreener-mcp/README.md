# DexScreener MCP

DEX pair data from the public DexScreener API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search token pairs.
* `tokens`  Top pairs for a token.

* `top_boosts`
* `latest_boosts`
* `token_orders`
* `multi_tokens`
* `trending`
* `token_profiles`
* `pair_details`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public DexScreener API.
