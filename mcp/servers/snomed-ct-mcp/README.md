# SNOMED CT MCP

SNOMED CT MCP: parse RF2 files, validate SCTIDs, columns and active flags.

No network calls. Files are parsed locally and nothing leaves the machine.

## Install

```bash
npx -y @mrfentmen/snomed-ct-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "snomed-ct-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/snomed-ct-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `detect_files` | Find SNOMED CT files in a directory tree. |
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
| `diff` | Compare two documents. |
| `to_json` | Export every record as JSON. |

## Safety

This server reads and writes local files. Treat file paths as trusted input.
Invalid documents are reported, never silently repaired.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
