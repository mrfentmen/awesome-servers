# Browser MCP

Control a local headless Chrome browser through the DevTools protocol. Open pages, read titles and text, and capture screenshots. No external service and no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `open_page`  Open a URL and return the title and a bounded text sample.
* `screenshot_page`  Capture a PNG screenshot to a local file and return its path.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Chrome must be installed on the machine. The server launches its own headless instance with a private profile and closes it after each call.

Security boundary: this server opens any URL the agent asks it to open, including localhost and intranet addresses. That is the point of an agent driven browser tool. Use it only in environments where the agent that calls it is trusted.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `run_script`
* `page_links`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-browser-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
