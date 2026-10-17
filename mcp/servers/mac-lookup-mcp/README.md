# MAC Lookup MCP

Look up the vendor of a MAC address from the public MAC Vendors database. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `vendor_lookup`  Vendor for a MAC address.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Vendor data comes from the public MAC Vendors API.


