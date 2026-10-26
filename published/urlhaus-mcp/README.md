# urlhaus-mcp

Query URLhaus (abuse.ch, free auth-key from abuse.ch; set URLHAUS_AUTH_KEY, sent as Auth-Key header): recent malicious URLs, URL lookup, payload lookup by SHA256, tag search.

## Tools

- `recent_urls` — Recently added malicious URLs.
- `lookup_url` — Check one URL against URLhaus.
- `lookup_payload` — Malware payload details for one SHA256 hash.
- `search_tag` — Malicious URLs carrying a malware tag, e.g. emotet.

## Source

[urlhaus-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/urlhaus-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
