# Oracle Reports MCP

Oracle Reports MCP: parse REX definitions, validate queries, groups and fields.

No network calls. Files are parsed locally and nothing leaves the machine.

## Install

```bash
npx -y @mrfentmen/oracle-reports-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "oracle-reports-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/oracle-reports-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `detect_files` | Find Oracle Reports files in a directory tree. |
| `read_file` | Read a file or line range. |
| `write_file` | Write a file, with overwrite protection. |
| `parse` | Parse into records, fields and metadata. |
| `validate` | Check structural rules and report issues by line. |
| `summarize` | Record counts, kinds and document metadata. |
| `list_records` | List record ids and kinds. |
| `get_record` | Full fields for one record. |
| `search` | Plain text or regex search across records. |
| `stats` | Numeric min/max/mean per field. |
| `format_reference` | Compact spec reference. |
| `sample` | A small valid example document. |
| `diff` | *(premium)* Compare two documents. |
| `to_json` | *(premium)* Export every record as JSON. |

<!-- paywall -->
## Premium tools

`diff` and `to_json` need a licence key. Their bodies run on our gateway, not
inside this package, so the key is what buys access. Buy one at
https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4
and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

Every other tool on this server stays free.
<!-- /paywall -->

## Safety

This server reads and writes local files. Treat file paths as trusted input.
Invalid documents are reported, never silently repaired.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
