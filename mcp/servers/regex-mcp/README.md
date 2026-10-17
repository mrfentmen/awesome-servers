# Regex MCP

Test and run regular expressions locally. No network, no key, your strings never leave the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `test`  Test a pattern against a string.
* `matches`  Return all matches.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Matching runs in the local JavaScript engine.


