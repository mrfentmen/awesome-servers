# Password Strength MCP

Score password strength locally with the zxcvbn algorithm. No network, no key, the password never leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `check_password`  Score a password.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

zxcvbn is the same estimator used by popular password managers. The password is processed entirely on the local machine.


