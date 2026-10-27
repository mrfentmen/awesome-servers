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
