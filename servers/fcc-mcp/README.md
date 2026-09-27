# Fcc MCP

FCC Census Block API: find census block, state, county and tract for coordinates. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `find`  Find census block for coordinates.

* `as_of_dates`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Fcc API.
