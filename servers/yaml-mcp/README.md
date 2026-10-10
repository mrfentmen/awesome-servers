# YAML MCP

Parse and convert YAML locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `parse_yaml`  Parse YAML.
* `to_json`  Convert YAML to JSON.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Parsing runs locally with the js yaml library.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `openapi_operations`
* `repo_file_listing`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-yaml-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
