# ListenBrainz MCP

Music listening history from the public ListenBrainz API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `user`  Recent listens.
* `popular`  Top artists.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public ListenBrainz API.


