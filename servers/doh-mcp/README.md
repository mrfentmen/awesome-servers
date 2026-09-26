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

## Setup

No setup. Queries go over DNS-over-HTTPS to public keyless resolvers.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
