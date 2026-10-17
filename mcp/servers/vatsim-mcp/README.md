# VATSIM MCP

Live flight simulation network data from the public VATSIM API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `pilots`  Connected pilots.
* `controllers`  Connected ATC.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public VATSIM API.


