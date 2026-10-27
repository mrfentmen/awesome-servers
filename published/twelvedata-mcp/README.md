# TwelveData MCP

Stock quotes from the public Twelve Data API. The demo key works for common symbols. No signup required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `quote`  Latest quote for a symbol, e.g. AAPL: price and change.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Twelve Data API.

## Licence

Every tool in this package is free: no licence key, no paid tier, no hosted gateway. Everything runs locally.
