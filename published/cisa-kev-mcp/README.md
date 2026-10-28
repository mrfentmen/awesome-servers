# cisa-kev-mcp

Search CISA's Known Exploited Vulnerabilities catalog. This is a focused companion to vulnerability scanners: it helps an agent identify vulnerabilities that CISA has marked as exploited in the wild.

## Tools

- `search_known_exploited`: search CVE, vendor, product, vulnerability name, and description fields.
- `recent_known_exploited`: list recently added catalog entries.
- `catalog_info`: inspect catalog version, release date, and entry count.

The feed is public and keyless. Catalog inclusion is a prioritization signal, not a complete risk assessment or a guarantee that a system is vulnerable.

## Run

```bash
npm install
npm run build
node dist/index.js
```
