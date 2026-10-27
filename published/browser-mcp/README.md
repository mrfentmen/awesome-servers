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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
