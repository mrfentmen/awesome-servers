# RIPE Stat

Internet routing data from RIPE Stat: ASN, prefix, BGP and geolocation lookups.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ripestat-mcp
```

## Tools

| Tool | What it does |
|---|---|
| `network_info` | Which ASN announces an IP or prefix, and the covering prefix |
| `prefix_overview` | Who announces a prefix, with holder names |
| `as_overview` | Summary of an autonomous system: holder and announcement status |
| `announced_prefixes` | Prefixes an ASN announces |
| `asn_neighbours` | ASNs that peer with or transit an ASN |

## Data source

RIPE NCC Stat API
