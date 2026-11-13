# HL7 CDA MCP

CDA MCP: parse HL7 clinical documents, validate templates, patient and sections.

No network calls. Files are parsed locally and nothing leaves the machine.

## Install

```bash
npx -y @mrfentmen/hl7-cda-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "hl7-cda-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hl7-cda-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `detect_files` | Find HL7 CDA files in a directory tree. |
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
