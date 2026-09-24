# CheapShark MCP

Find game deals and price history from the public CheapShark API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `deals`  Current game deals.
* `store_list`  Tracked stores.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Deal data comes from the public CheapShark API.
