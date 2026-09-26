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

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Disify API.
