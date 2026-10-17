# Firefox Add-ons MCP

Search Firefox browser extensions on the public AMO API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search add-ons.
* `addon`  Details for one add-on.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Mozilla Add-ons API.


