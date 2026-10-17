# Blockchair MCP

Blockchain stats from the public Blockchair API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `stats`  Bitcoin network stats.
* `chain`  Stats for a chain.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Blockchair API.


