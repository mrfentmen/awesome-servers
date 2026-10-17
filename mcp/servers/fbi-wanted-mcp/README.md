# Fbi Wanted MCP

FBI Wanted API: most wanted list, search, and top rewards. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `wantedList`  Paginated FBI Wanted list.
* `search`  Search FBI Wanted by title.
* `topRewards`  Most wanted with reward amounts.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


