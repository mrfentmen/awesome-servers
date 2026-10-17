# Maltiverse MCP

Threat intelligence data from the public Maltiverse API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `ip`  Threat data for an IP.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Maltiverse API.


