# test-shape-mcp

Test Shape gives a quick structural view of a local test suite. It counts test blocks, suites, async tests, assertion-bearing files, and empty test bodies without exposing test names or code.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_test_shape` against a local project. Results are heuristics for review triage, not a replacement for running tests.

## Privacy and limits

Only bounded local test files are read. The response contains aggregate counts only. Test names, paths, source, and assertion details are suppressed.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `analyze_test_source`
* `ci_run_history`
* `commit_checks`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
