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

## Usage

```bash
npm install
npm run build
node dist/index.js
```

MX records are resolved through the DNS of the sending machine. A missing MX record does not guarantee an inbox does not exist, the result is honest about that.
