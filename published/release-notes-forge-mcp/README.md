# release-notes-forge-mcp

Release Notes Forge reads local Git history and turns it into a release shape: commit count, broad change categories, and age buckets.

## Quick start

```bash
npm install
npm test
npm start
```

Use `summarize_release_history` with a local repository path inside `RELEASE_NOTES_ROOT`. The server never pushes, edits, or contacts a remote repository.

## Privacy and limits

Commit messages, hashes, paths, branches, remotes, and author identities are suppressed. This is an aggregate release planning aid, not a changelog generator.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
