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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `host_search`
* `as_lookup`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
