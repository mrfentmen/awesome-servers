# IP Geo MCP

Geolocate IP addresses with country, region, city, and ISP data. No key required for limited use.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `lookup`  Geolocate an IP.
* `my_ip`  Current machine public IP.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public ip api. The free tier is limited to 45 requests per minute from one IP.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
