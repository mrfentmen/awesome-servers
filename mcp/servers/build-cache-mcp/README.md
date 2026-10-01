# build-cache-mcp

Build Cache summarizes local build and cache footprint. It helps explain why a workspace is slow or large without exposing filenames or contents.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_build_cache` with a local project path.

## Privacy and limits

Only file metadata inside recognized artifact directories is read. The response contains aggregate size and age buckets, directory counts, and file counts. It does not return paths, names, contents, or dependency data. Recursion, file count, file size, and total byte limits prevent unbounded scans.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `npm_package_metadata`
* `github_latest_release`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
