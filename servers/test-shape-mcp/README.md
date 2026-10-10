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

These tools need a license key:

* `analyze_test_source`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-test-shape-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
