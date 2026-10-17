# Air Quality MCP

Live air quality index and pollutant levels from Open Meteo. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `air_quality`  Current AQI for a location.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Open Meteo air quality API.


