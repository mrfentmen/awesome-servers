# Password Breach Check MCP

Check if a password has appeared in known data breaches using the k anonymity method. Only the first 5 characters of the hash ever leave the machine. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `check_password`  Check a password.
* `check_hash`  Check a full SHA1 hash.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Uses the Have I Been Pwned range API. The full password never leaves the machine.


