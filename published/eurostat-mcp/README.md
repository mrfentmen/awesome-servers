# Eurostat MCP

European statistics datasets from the public Eurostat dissemination API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `dataset`  Dataset summary and values.

* `unemployment`
* `gdp`
* `population`
* `inflation`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Eurostat API, the official EU statistics source.
