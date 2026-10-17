# Envirocar MCP

enviroCar open environmental car tracking data. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `tracks`  List recent tracks.
* `track_detail`  Get a track by id.
* `sensors`  List available sensor definitions.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Envirocar API.


