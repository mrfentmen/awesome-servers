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

These tools need a licence key:

* `package_vulnerabilities`
* `cve_search`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
