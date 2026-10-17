# 7Timer MCP

Weather forecasts from the public 7Timer API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `forecast`  Weather for coordinates.
* `forecast_summary`  Summary of the civil series.
* `daily_outlook`  Daily outlook.
* `forecast_by_place`  Forecast by place name.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public 7Timer API.
