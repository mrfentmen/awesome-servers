# Password Generator MCP

Generate strong random passwords and passphrases locally using the crypto random source. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate_password`  Random password.
* `passphrase`  Random word passphrase.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Generation uses the operating system crypto random source. Nothing is stored or sent anywhere.


