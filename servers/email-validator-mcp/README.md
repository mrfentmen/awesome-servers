# Email Validator MCP

Validate email addresses without sending mail. Checks the format, looks up the MX record, and flags disposable domains. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate_email`  Check one email address: format, live MX records, disposable-domain status, role account (info@, support@) and whether it is a free provider.
* `validate_batch`  Validate up to 25 addresses at once and get a count of well-formed, malformed and risky ones.
* `check_domain`  Domain-level mail check: MX records, A records, and whether the domain is a disposable or free provider.
* `normalize_email`  Canonical form of an address: lowercase the domain, drop the +tag, and remove Gmail dots, so duplicates collapse to one record.
* `extract_emails`  Pull every unique email address out of a block of text, flagging any disposable domains.
* `disposable_domains`  List the known disposable email domains this server checks against.
* `email_auth_records`  The full anti-spoofing picture for a domain: MX hosts, SPF with its all-rule, DMARC policy and DKIM selectors.
* `mx_health`  Every MX host for a domain, whether it resolves to an A record, and its reverse DNS.
* `correct_typo`  Suggests the mail provider a mistyped domain probably meant, e.g. gmial.com -> gmail.com, without contacting the domain.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

MX records are resolved through the DNS of the sending machine. A missing MX record does not guarantee an inbox does not exist, the result is honest about that.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `smtp_mailbox_check`
* `spf_evaluate`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
