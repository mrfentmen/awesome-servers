# hibp-mcp

Data breach catalogue and password leak checks - no API key.

## Tools

- `breach_catalog` — Search the Have I Been Pwned catalogue of disclosed breaches, largest first, filtered by domain or year.
- `breach_detail` — Full record for one breach by its catalogue name, including the account count, data classes and description.
- `recent_breaches` — Breaches most recently added to the catalogue, newest first, optionally limited to the last N days.
- `breach_stats` — Aggregate picture of the breach catalogue: accounts exposed, verification rate, breaches per year and the data types leaked most.
- `data_classes` — Which kinds of personal data leak most often, ranked by how many breaches exposed each type.
- `password_exposure` — Check one password against known breach dumps. Uses k-anonymity, so the password is never transmitted.
- `password_audit` — Check up to 10 passwords at once and report which have already appeared in a breach.
- `latest_breach` — The newest breach added to Have I Been Pwned: domain, date, account count and exposed data.
- `password_strength` — Entropy and crack-time estimate for a password, plus whether it already appears in a breach.

## Setup

No setup. The catalogue and the password range API are public, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `package_vulnerabilities`
* `cve_search`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-hibp-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
