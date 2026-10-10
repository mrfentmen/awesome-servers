# Disify MCP

Email validation from the public Disify API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `check`  Validate an email address: format, disposable domain, DNS records.
* `check_domain`  Validate an email domain: disposable, free provider, whitelist and DNS status.
* `check_bulk`  Validate up to 10 email addresses in one call and count how many are disposable.
* `mx_records`  List the MX mail hosts for a domain, useful for checking whether a mailbox can receive mail.
* `dns_lookup`  Resolve live DNS records for a domain — A, AAAA, MX, NS, TXT, CNAME, SOA, CAA, PTR or SRV — via public DNS-over-HTTPS.
* `domain_summary`  One report on a domain: disposable verdict plus live A, NS and MX records, so you can tell whether signups from it are trustworthy.
* `dnssec_check`  Check whether a domain is DNSSEC signed: validating-resolver AD flag, DNSKEY records and the parent DS.
* `email_auth`  SPF, DMARC, DKIM and MX for a domain, so you can tell whether its mail can be spoofed.
* `lookalike_domains`  Test typo, homoglyph and alternative-TLD variants of a domain and report which ones resolve.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Disify API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `domain_registration`
* `typo_check`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
