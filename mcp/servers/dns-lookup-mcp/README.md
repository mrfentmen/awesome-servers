# DNS Lookup MCP

Look up DNS records for any domain through Google DNS over HTTPS. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `lookup`  Look up a record type.
* `lookup_all`  Look up common record types.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Resolutions come from the public Google DNS over HTTPS resolver.


