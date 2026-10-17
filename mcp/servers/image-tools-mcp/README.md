# Image Tools MCP

Resize and inspect local images with the sharp engine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `resize_image`  Resize a local image.
* `inspect_image`  Return image format and dimensions.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned.


