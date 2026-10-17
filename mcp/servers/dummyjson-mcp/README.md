# DummyJSON MCP

Dummy JSON test data from the public DummyJSON API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `products`  List products.
* `recipes`  List recipes.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public DummyJSON API.


