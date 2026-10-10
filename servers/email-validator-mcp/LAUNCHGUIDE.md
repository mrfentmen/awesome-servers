# Email Validator MCP

## Tagline
Validate email addresses by format, MX record, and disposable domain. No key required.

## Description
Validate email addresses by format, MX record, and disposable domain. No key required. Published from a private commercial monorepo. Not affiliated with or endorsed by Email Validator.

## Setup Requirements
- No configuration required. Works out of the box with no API keys.

## Category
Developer Tools

## Features

- Validate email: Check one email address: format, live MX records, disposable-domain status, role account (info@, support@) and whether it is a free provider.
- Validate batch: Validate up to 25 addresses at once and get a count of well-formed, malformed and risky ones.
- Check domain: Domain-level mail check: MX records, A records, and whether the domain is a disposable or free provider.
- Normalize email: Canonical form of an address: lowercase the domain, drop the +tag, and remove Gmail dots, so duplicates collapse to one record.
- Extract emails: Pull every unique email address out of a block of text, flagging any disposable domains.
- Disposable domains: List the known disposable email domains this server checks against.
- Email auth records: The full anti-spoofing picture for a domain: MX hosts, SPF with its all-rule, DMARC policy and DKIM selectors.
- MX health: Every MX host for a domain, whether it resolves to an A record, and its reverse DNS.
- Correct typo: Suggests the mail provider a mistyped domain probably meant, e.g. gmial.com -> gmail.com, without contacting the domain.

## Getting Started

- "Ask your assistant about email validator using this server once installed"
- Tool: validate_email — Check one email address: format, live MX records, disposable-domain status, role account (info@, support@) and whether it is a free provider.
- Tool: validate_batch — Validate up to 25 addresses at once and get a count of well-formed, malformed and risky ones.
- Tool: check_domain — Domain-level mail check: MX records, A records, and whether the domain is a disposable or free provider.
- Tool: normalize_email — Canonical form of an address: lowercase the domain, drop the +tag, and remove Gmail dots, so duplicates collapse to one record.
- Tool: extract_emails — Pull every unique email address out of a block of text, flagging any disposable domains.
- Tool: disposable_domains — List the known disposable email domains this server checks against.
- Tool: email_auth_records — The full anti-spoofing picture for a domain: MX hosts, SPF with its all-rule, DMARC policy and DKIM selectors.
- Tool: mx_health — Every MX host for a domain, whether it resolves to an A record, and its reverse DNS.
- Tool: correct_typo — Suggests the mail provider a mistyped domain probably meant, e.g. gmial.com -> gmail.com, without contacting the domain.

## Tags
email validator, mcp, data, keyless

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/email-validator-mcp
