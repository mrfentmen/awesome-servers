# Bay Wheels MCP

Bay Wheels bike share stations from the public GBFS feed. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `stations`  List stations.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Bay Wheels GBFS feed.


