# SQL Formatter MCP

Format SQL queries into readable layouts on the local machine. No network, no key, the query never leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `format`  Format a SQL query.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Formatting uses the open source sql-formatter library and supports common dialects.


