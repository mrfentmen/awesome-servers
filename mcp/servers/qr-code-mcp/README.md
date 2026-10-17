# QR Code MCP

Generate QR codes as real PNG images on the local machine. No network, no key, no external service.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate_qr`  Generate a QR code PNG.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned.


