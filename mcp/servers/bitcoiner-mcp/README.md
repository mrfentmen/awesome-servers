# Bitcoiner MCP

Bitcoin transaction fee estimates from the public bitcoiner.live API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `fees`  Current fee estimates.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public bitcoiner.live API.


