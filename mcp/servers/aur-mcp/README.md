# AUR MCP

Arch User Repository package data from the public AUR RPC. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search packages.
* `info`  Details for one package.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public AUR RPC endpoint.


