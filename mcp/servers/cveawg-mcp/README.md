# CVE Services MCP

Authoritative CVE records from MITRE's CVE Services — description, CVSS severity, affected products, weakness type and references. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/cveawg-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "cveawg-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/cveawg-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `cve` | One CVE record by id: state, assigner, dates, CVSS score, affected products, references, description |

## Example

```
CVE-2024-3094 — Malicious code was discovered in the upstream tarballs of xz

State: PUBLISHED
Assigner: redhat
Reserved: 2024-03-29
Published: 2024-03-29
Updated: 2026-11-04
Severity: 10 CRITICAL (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H)
Affected:
   - xz: 5.6.0, 5.6.1
```

## Notes

Reads the public CVE Services API (`cveawg.mitre.org/api/cve/`). No key, no login.

This is the CNA-published record, not the NVD enrichment. CVSS comes from the
assigning CNA, so a CVE that NVD has rescored may show a different number here.

Ids are up-checked for you. An unknown id returns a plain message instead of an
empty record.

## Licence

MIT
