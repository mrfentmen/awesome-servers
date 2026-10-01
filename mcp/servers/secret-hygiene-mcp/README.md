# secret-hygiene-mcp

Secret Hygiene scans bounded local files for common secret-like patterns and returns category counts only. It is designed as a pre-commit review signal, not a credential detector with perfect coverage.

## Quick start

```bash
npm install
npm test
npm start
```

Use `scan_secret_hygiene` inside `SECRET_HYGIENE_ROOT`.

## Privacy and limits

Values, keys, matches, filenames, paths, and source text are never returned. Pattern matching is conservative and can produce false positives or miss unusual formats. Rotate exposed credentials separately.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `entropy_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
