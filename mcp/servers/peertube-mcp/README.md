# Peertube MCP

Search PeerTube.tv federated videos and read instance info. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `searchVideos`  Search PeerTube.tv videos.
* `instance`  PeerTube.tv instance info.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


