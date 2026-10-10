# migration-map-mcp

Migration Map inspects migration filenames and reports numbering gaps, duplicates, and broad risk signals. It is useful before merging database changes when the migration directory has become hard to reason about.

## Quick start

```bash
npm install
npm test
npm start
```

Call `inspect_migration_map` with a project path inside `MIGRATION_MAP_ROOT`.

## Privacy and limits

The server reads migration filenames only. It reports sequence gaps, duplicate numbers, and pairs a sequence when both a forward filename and a rollback-style filename are present. It does not read SQL, source content, migration names, or full paths. Naming conventions outside the recognized pattern may be missed.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `migration_ordering`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-migration-map-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
