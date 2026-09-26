# DNS over HTTPS MCP

## Tagline
DNS lookups, email records and reverse DNS - no API key.

## Description
Look up DNS from your AI assistant: any record type for a host, whole-domain summaries, MX/SPF/DMARC email setup, CAA issuers and reverse DNS. Queries run over DNS-over-HTTPS against public resolvers, so no local resolver or key is needed. An independent MCP server. Not affiliated with or endorsed by Cloudflare, Google or AdGuard.

## Setup Requirements
No setup. Queries go over DNS-over-HTTPS to public keyless resolvers.

## Category
Developer Tools

## Features
- Resolve DNS record: Look up DNS records for a hostname over HTTPS (no local resolver needed). Returns the record values with their TTL.
- Resolve many names: Resolve one record type for up to 15 hostnames in a single call. Handy for checking a list of domains at once.
- DNS record summary: Every common record for a domain in one call: A, AAAA, CNAME, MX, TXT, NS, SOA and CAA. Good first call when auditing a domain.
- Email DNS check: Mail setup for a domain: MX hosts, SPF, DMARC and CAA, plus a note about anything missing.
- CAA records: Which certificate authorities may issue TLS certificates for a domain, and whether any authority is allowed.
- Reverse DNS lookup: Turn an IPv4 or IPv6 address into its hostname by querying the PTR record.
- List resolvers: The keyless DoH resolvers this server can query, and the record types it understands.

## Getting Started
- Ask your assistant about doh using this server once installed
- Tool: resolve — Look up DNS records for a hostname over HTTPS (no local resolver needed). Returns the record values with their TTL.
- Tool: resolve_many — Resolve one record type for up to 15 hostnames in a single call. Handy for checking a list of domains at once.
- Tool: record_summary — Every common record for a domain in one call: A, AAAA, CNAME, MX, TXT, NS, SOA and CAA. Good first call when auditing a domain.
- Tool: email_records — Mail setup for a domain: MX hosts, SPF, DMARC and CAA, plus a note about anything missing.
- Tool: caa_records — Which certificate authorities may issue TLS certificates for a domain, and whether any authority is allowed.
- Tool: reverse_lookup — Turn an IPv4 or IPv6 address into its hostname by querying the PTR record.
- Tool: providers — The keyless DoH resolvers this server can query, and the record types it understands.

## Tags
dns, doh, email, spf, dmarc, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/doh-mcp
