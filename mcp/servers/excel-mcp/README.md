# Excel MCP

Create and read Excel workbooks on the local machine. No network, no key. Real xlsx files written to and read from disk.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `create_workbook`  Create an xlsx workbook from rows.
* `read_workbook`  Read the first rows of an existing workbook.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned.


