# mitre-attack-mcp

Search the MITRE ATT&CK enterprise knowledge base for adversary techniques, tactics, and mitigations. The STIX bundle is cached locally with a TTL so repeated calls are fast.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search techniques by keyword.
* `technique`  Get one technique by ID.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

<!-- paywall -->
## Premium tools

These tools need a license key:

* `group_list`
* `software_list`
* `tactic_list`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-mitre-attack-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
