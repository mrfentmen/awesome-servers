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

These tools need a licence key:

* `dns_records`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
