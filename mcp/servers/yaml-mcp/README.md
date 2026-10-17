# YAML MCP

Parse and convert YAML locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `parse_yaml`  Parse YAML.
* `to_json`  Convert YAML to JSON.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Parsing runs locally with the js yaml library.


