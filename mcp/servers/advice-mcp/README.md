successfully downloaded text file (SHA: fac7db320d063fab8f8cbdf2c6885597b35fb304)
# Advice MCP

Random pieces of advice from the public Advice Slip API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `random`  A random piece of advice.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Advice Slip API.

## Tools

* `random`  Random advice.
* `advice_search`  Search advice by topic.
* `advice_by_id`  Get advice by ID.
