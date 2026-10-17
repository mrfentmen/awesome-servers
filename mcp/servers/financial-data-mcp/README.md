# Financial Data MCP

Read economic data from FRED and daily US Treasury rates. No API key is required for either source.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get_fred_series`  Any FRED series such as GDP, UNRATE, or CPIAUCSL.
* `get_treasury_rates`  Current Treasury yield curve rates.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

FRED data is read from the public CSV endpoint. Treasury data comes from the Fiscal Data API.


