# CSV MCP

Parse, inspect, and summarize CSV data locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `parse_csv`  Parse CSV into a table.
* `csv_info`  Columns and row count.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Parsing runs locally. Standard CSV quoting is supported.


