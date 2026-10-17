# Carbon Intensity MCP

UK grid carbon intensity, forecast, and regional breakdown from the public Carbon Intensity API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `intensity`  Current intensity.
* `forecast`  Next 48 hours.
* `regional`  By region.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Carbon Intensity API for the UK electricity grid.


