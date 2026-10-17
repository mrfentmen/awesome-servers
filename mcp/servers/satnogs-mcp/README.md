# Satnogs MCP

SatNOGS DB: satellite transmitter and observation data. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `transmitters`  List satellite transmitters.
* `by_mode`  Transmitters by mode.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Satnogs API.


