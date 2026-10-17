# Open Notify MCP

Live people-in-space and ISS position from the public Open Notify API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `astronauts`  People in space.
* `iss`  ISS position.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Open Notify API.


