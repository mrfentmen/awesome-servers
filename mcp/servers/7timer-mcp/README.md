successfully downloaded text file (SHA: 7979510792ea128af36cfe27430539a98047e1f3)
# 7Timer MCP

Weather forecasts from the public 7Timer API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `forecast`  Weather for coordinates.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public 7Timer API.

## Tools

* `forecast`  Weather for coordinates.
* `forecast_summary`  Summary of the civil series.
* `daily_outlook`  Daily outlook.
* `forecast_by_place`  Forecast by place name.
