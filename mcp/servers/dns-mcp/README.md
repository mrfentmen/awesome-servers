# DNS Lookup

Live DNS lookups - A, AAAA, MX, TXT, NS, CNAME, SOA, CAA and SRV records, PTR reverse lookups and email set-up checks, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dns-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dns-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dns-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `resolve_host` | Resolve a hostname to A, AAAA, MX, TXT, NS, CNAME, SOA, CAA or SRV records. |
| `reverse_lookup` | PTR lookup: the hostname(s) behind an IP address. |
| `email_deliverability` | Check whether a domain can receive email: MX records, null MX, SPF and DMARC. |

## Data source

Uses the operating system resolver through Node's dns module. Every call is a live DNS query; nothing is cached here.
