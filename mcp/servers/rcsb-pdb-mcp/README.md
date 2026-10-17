# RCSB PDB MCP

Look up protein structures and search the RCSB Protein Data Bank from the public RCSB APIs. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `entry`  Metadata for one PDB entry.
* `search`  Search structures by text.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public RCSB PDB REST and search APIs.


