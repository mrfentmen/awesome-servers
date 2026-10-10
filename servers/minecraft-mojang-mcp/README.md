# Minecraft MCP

Minecraft player and server data from the public Mojang API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `profile`  Player profile.
* `server`  Server status.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Mojang and mcsrvstat APIs.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `latest_version`
* `wiki_search`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
