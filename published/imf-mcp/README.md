# IMF MCP

IMF economic indicators from the public IMF datamapper API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `indicator`  Indicator series for a country.

* `indicators_list`
* `compare_countries`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public IMF datamapper API.
