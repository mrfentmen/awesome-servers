# marine-forecast-mcp

Wave height, wave period, and sea surface temperature forecasts from the free Open Meteo marine API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `forecast`  Marine forecast for a location.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


