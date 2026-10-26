# Lever MCP

Public job postings from the Lever API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `postings`  List every open posting on a company Lever job board, with team, location and workplace type.
* `posting`  Get one Lever posting by id, including the full plain-text description and apply link.
* `search_postings`  Search a company Lever board by title, team, department, location or commitment.
* `recent_postings`  A company's Lever postings sorted newest first, with the date each went up.
* `departments`  A company's Lever postings grouped by department, ranked by how many are open.
* `teams`  List the teams hiring on a company Lever board, ranked by number of postings.
* `locations`  List where a company is hiring on Lever, with posting counts per location.
* `grouped_postings`  Lever's own server-side grouping: counts per team, department, location or commitment, with examples.
* `newest_since`  Postings added on or after a date - what changed on the board since you last looked.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Lever API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `hiring_velocity`
* `company_comparison`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-lever-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
