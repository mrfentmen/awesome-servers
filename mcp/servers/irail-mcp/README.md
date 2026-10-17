# iRail MCP

Belgian rail data from the public iRail API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `stations`  List stations.
* `connections`  Connections between stations.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public iRail API.


