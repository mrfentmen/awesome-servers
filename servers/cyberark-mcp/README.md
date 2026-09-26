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

## Setup

No setup. Breach lookups use the public k-anonymity API and the rest runs locally.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
