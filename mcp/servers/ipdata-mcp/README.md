# ipdata-mcp

MCP server for the [ipdata](https://ipdata.co) IP intelligence API: geolocation,
timezone, currency, mobile carrier, ASN, company, threat intelligence and VPN
detection for any IP address.

Checked 2026-10-23: ipdata's own GitHub org ships client libraries only — no
first-party MCP server — and no MCP package exists on npm under this name.
Neighbouring vendors (IPinfo, IP2Location.io) do publish official MCP servers,
which makes this the covered gap.

## Tools

All lookup tools take one optional `ip` (omitted = the caller's own IP). Each
sliced tool is one real ipdata call that keeps only the block its name says.

| Tool | What it does |
|---|---|
| `ipdata_lookup` | full profile, with an optional top-level `fields` whitelist |
| `ipdata_self` | full profile for the caller's own IP ("which network am I on") |
| `ipdata_location` | city, region, country, continent, lat/long, postal, timezone |
| `ipdata_timezone` | timezone block (name, UTC offset, current time) |
| `ipdata_currency` | currency block for the IP's country |
| `ipdata_languages` | languages spoken in the IP's country |
| `ipdata_carrier` | mobile carrier block (name, MCC, MNC) |
| `ipdata_asn` | ASN block (number, type, domain, name, route) |
| `ipdata_company` | company block (organisation, domain, type) |
| `ipdata_threat` | threat-intelligence flags (tor/proxy/attacker/abuser/cloud/bogon/mobile) |
| `ipdata_vpn` | VPN detection block (tier-dependent) |
| `ipdata_threat_summary` | compact fraud-triage view: threat + ASN + company + carrier + one-line location |
| `ipdata_bulk` | 1–50 unique IPs, full profiles, in one POST to `/bulk` |
| `ipdata_bulk_country` | same bulk call reduced to light `ip → country_code` rows |

## Auth

One free key. Set it before starting the server:

```sh
export IPDATA_API_KEY=...
```

Optional: `IPDATA_EU=1` routes every call through `eu-api.ipdata.co` so
end-user IPs stay in the EU (same API shape, per ipdata's docs).

## Run

```sh
cd mcp/servers/ipdata-mcp
npm install
npm run build
node dist/index.js        # stdio MCP server
npm test                  # unit tests (pure helpers)
python3 tools/smoke.py    # live check; SKIPs honestly without a key
```

## Wire into OpenCode (`~/.config/opencode/opencode.jsonc`)

```jsonc
"ipdata": {
  "type": "local",
  "command": ["node", "/path/to/awesome-servers/mcp/servers/ipdata-mcp/dist/index.js"],
  "enabled": true,
  "environment": { "IPDATA_API_KEY": "..." },
  "timeout": 60000
}
```

## Honesty notes

- Field shapes (`threat`, `asn`, `company`, `carrier`, `vpn`) pass through from
  the API untouched; the summary tool only picks and nests what is already
  there. Some blocks (e.g. `vpn` detail) depend on the account tier.
- The bulk endpoint is capped at 50 unique IPs per call by this server; the
  vendor's own quota rules still apply on top.
