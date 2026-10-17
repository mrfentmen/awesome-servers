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


