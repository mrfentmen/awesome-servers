# Translation MCP

Translate text between languages with the free MyMemory API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `translate`  Translate text between languages.
* `detect_and_translate`  Translate with auto detection.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

MyMemory offers a free tier with a daily character limit. The server reports quota status honestly.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
