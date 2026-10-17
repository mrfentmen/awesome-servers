# Zip Codes MCP

Look up US postal codes, cities, and states from the public Zippopotam API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `zip_lookup`  City and state for a zip.
* `city_lookup`  Zip codes for a city.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Zippopotam API.


