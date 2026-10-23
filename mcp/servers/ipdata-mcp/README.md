# ipdata-mcp

MCP server for the [ipdata](https://ipdata.co) IP intelligence API: geolocation,
timezone, currency, mobile carrier, ASN, company, threat intelligence and VPN
detection for any IP address.

Checked 2026-10-23: ipdata's own GitHub org ships client libraries only — no
first-party MCP server — and no MCP package exists on npm under this name.
Neighbouring vendors (IPinfo, IP2Location.io) do publish official MCP servers,
which makes this the covered gap.

## Tools

| Tool | What it does |
|---|---|
| `ipdata_lookup` | full profile for one IP (or the caller's own IP when `ip` is omitted), with an optional top-level `fields` whitelist |
| `ipdata_bulk` | 1–50 unique IPs in one POST to `/bulk` |
| `ipdata_threat_summary` | compact fraud-triage view: threat flags, ASN, company, carrier, VPN, one-line location |

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
