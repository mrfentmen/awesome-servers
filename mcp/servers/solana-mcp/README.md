# Solana MCP

Solana chain status from the public Solana RPC. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `slot`  Current slot.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Solana RPC.


