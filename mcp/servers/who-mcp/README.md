# WHO MCP

Global health indicators from the public WHO Global Health Observatory API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `indicator`  Values for a WHO indicator.
* `search`  Search indicators.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public WHO GHO API. Commercial health data providers charge for this kind of data.


