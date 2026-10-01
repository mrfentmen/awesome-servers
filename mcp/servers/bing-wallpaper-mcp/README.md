# Bing Wallpaper MCP

The daily Bing wallpaper image and its metadata from the public Bing feed. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `today`  Today wallpaper.
* `recent`  Recent wallpapers.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Images come from the public Bing image archive feed.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `archive`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
