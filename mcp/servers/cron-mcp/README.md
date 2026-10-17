# Cron MCP

Parse, describe, and compute next runs for cron expressions on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `describe`  Describe a cron expression.
* `next`  Next run times.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Parsing uses the open source cron-parser library and runs entirely locally.


