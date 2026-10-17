# Exoplanets MCP

Confirmed exoplanets and their properties from the public NASA Exoplanet Archive. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `recent`  Recently confirmed planets.
* `by_name`  Look up one planet.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public NASA Exoplanet Archive TAP service.


