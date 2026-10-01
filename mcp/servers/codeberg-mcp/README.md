# Codeberg MCP

Codeberg repository data from the public Codeberg API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search repositories.
* `version`  Server version.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Codeberg API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `repo_commits`
* `repo_issues`
* `file_contents`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-codeberg-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
