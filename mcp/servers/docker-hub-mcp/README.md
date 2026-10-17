# Docker Hub MCP

Look up Docker images, tags, and pull counts from the public Docker Hub API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `image_info`  Details for an image.
* `search_images`  Search images.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Docker Hub API.


