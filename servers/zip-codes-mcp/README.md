# Zip Codes MCP

Look up US postal codes, cities, and states from the public Zippopotam API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `zip_lookup`  City and state for a zip.
* `city_lookup`  Zip codes for a city.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Zippopotam API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `reverse_geocode`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-zip-codes-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
