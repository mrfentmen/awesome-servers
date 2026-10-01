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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `draft_release_digest`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
