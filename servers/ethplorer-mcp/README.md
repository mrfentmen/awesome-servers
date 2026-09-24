# Ethplorer MCP

Ethereum token explorer: token info, address holdings, transaction history. No key required for low volume. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `token_info`  Get ERC-20 token details by address.
* `address_info`  Get token holdings for an address.
* `token_history`  Get token transfer history.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Ethplorer API.
