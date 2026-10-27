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
