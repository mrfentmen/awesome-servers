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
