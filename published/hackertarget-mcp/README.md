# hackertarget-mcp

Query HackerTarget's free recon APIs (keyless): DNS lookup, reverse DNS, whois, geoIP, HTTP headers, reverse IP. Rate-limited free tier; be polite.

## Tools

- `dns_lookup` — A/AAAA/MX/NS records for a domain. Keyless.
- `reverse_dns` — PTR records for an IP address.
- `whois_lookup` — WHOIS record for a domain or IP.
- `geoip_lookup` — Country/region/city for IP or domain.
- `http_headers` — Response headers for a URL, with status code.
- `reverse_ip` — Domains and hostnames hosted on one IP address.

## Source

[hackertarget-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/hackertarget-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
