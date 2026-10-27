# Mastodon MCP

Mastodon instance data from the public Mastodon API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `instance`  Instance info.
* `trends`  Trending tags.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Mastodon API.

## Licence

Every tool in this package is free: no licence key, no paid tier, no hosted gateway. Everything runs locally.
