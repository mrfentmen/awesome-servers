# OTP MCP

Generate time based and counter based one time passwords locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate_totp`  TOTP code for a secret.
* `generate_hotp`  HOTP code for a counter.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All codes are generated locally from the RFC standard algorithm. Secrets never leave the machine.


