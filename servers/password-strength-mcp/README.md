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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `common_list_rank`
* `variant_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-password-strength-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
