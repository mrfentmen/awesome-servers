# Hugging Face MCP

Hugging Face model data from the public Hugging Face API. No key required for public data.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `models`  List public models.
* `model`  Details for one model.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Hugging Face API.


