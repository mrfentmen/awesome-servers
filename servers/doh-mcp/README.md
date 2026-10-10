# doh-mcp

DNS lookups, email records and reverse DNS - no API key.

## Tools

- `resolve` — Look up DNS records for a hostname over HTTPS (no local resolver needed). Returns the record values with their TTL.
- `resolve_many` — Resolve one record type for up to 15 hostnames in a single call. Handy for checking a list of domains at once.
- `record_summary` — Every common record for a domain in one call: A, AAAA, CNAME, MX, TXT, NS, SOA and CAA. Good first call when auditing a domain.
- `email_records` — Mail setup for a domain: MX hosts, SPF, DMARC and CAA, plus a note about anything missing.
- `caa_records` — Which certificate authorities may issue TLS certificates for a domain, and whether any authority is allowed.
- `reverse_lookup` — Turn an IPv4 or IPv6 address into its hostname by querying the PTR record.
- `providers` — The keyless DoH resolvers this server can query, and the record types it understands.
- `dnssec_check` — Whether a zone is signed and the resolver validated it: DNSKEY and DS records plus the AD flag.
- `propagation_check` — Resolve one record through Cloudflare, Google and AdGuard and say whether they agree - catches a DNS change that has not propagated.
- `txt_contains` — Check whether any TXT record on a domain contains a given string, for example a site-verification token or an SPF include.

## Setup

No setup. Queries go over DNS-over-HTTPS to public keyless resolvers.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `diagnose_lookup`
* `delegation_chain`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
