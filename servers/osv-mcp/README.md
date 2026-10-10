# OSV MCP

Open source vulnerability checks for coding agents. It uses the public OSV.dev API and needs no API key.

## Tools

* `check_package` checks an ecosystem, package name, and optional version
* `scan_packages` checks several package references in one request; parse lockfiles in your client and pass the package list
* `get_vulnerability` retrieves a CVE, GHSA, or OSV record

## Run

```bash
npm install
npm run build
node dist/index.js
```

The server is read only and uses stdio MCP transport.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `check_package`: Check a package and optional version for known open source vulnerabilities.
- `scan_packages`: Scan several package references in one OSV request. Pass a JSON array of ecosystem, name, and optional version.
- `get_vulnerability`: Retrieve one OSV vulnerability by ID, such as GHSA, CVE, or OSV identifier.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `check_package`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `advisory_database`
* `package_releases`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
