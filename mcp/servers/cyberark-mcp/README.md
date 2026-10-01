# cyberark-mcp

Password breach checks and identity security audits - no API key.

## Tools

- `check_password` — Check a password against known data breaches using k-anonymity, so only five characters of its SHA-1 hash are sent and the password itself never leaves your machine. No API key needed.
- `check_passwords` — Check up to 10 passwords for known breaches in one call and report how many have already been leaked.
- `password_strength` — Score a password offline: entropy, character classes, common-word, keyboard and sequence patterns, plus an estimated offline crack time and a clear verdict.
- `generate_password` — Generate a random password from a cryptographically secure source, with control over length and character classes, and report its estimated crack time.
- `breach_catalog` — List breaches from the Have I Been Pwned catalogue, largest first, filtered by company domain or year, with the number of accounts and the kinds of data exposed.
- `breach_detail` — Look up one breach by name and get its date, exposed account count, verification status and the classes of data leaked.
- `domain_email_security` — Audit a domain's anti-spoofing setup: SPF, DMARC, DKIM selectors, MX records and CAA, graded A to F with the exact gaps to fix.
- `identify_hash` — Identify the likely algorithm behind a hash string — bcrypt, Argon2, crypt formats, MD5, SHA-1, SHA-256, SHA-512 and more — entirely offline.
- `hash_text` — Compute MD5, SHA-1, SHA-256 or SHA-512 digests of a string locally, for checksum and fingerprint checks.
- `breach_timeline` — Year-by-year view of known breaches from Have I Been Pwned: how many sites were breached and how many accounts were exposed.
- `subdomain_inventory` — Resolve common subdomains of a domain and show what each points to, flagging third-party CNAME targets that no longer resolve.

## Setup

No setup. Breach lookups use the public k-anonymity API and the rest runs locally.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `dns_record_inventory`
* `password_variation_audit`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
