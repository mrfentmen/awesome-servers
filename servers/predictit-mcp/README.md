# PredictIt MCP

Prediction market contracts and prices from the public PredictIt API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `markets`  All markets.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public PredictIt market data API.
