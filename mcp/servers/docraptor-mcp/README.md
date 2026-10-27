# docraptor-mcp

MCP server for the [DocRaptor](https://docraptor.com) HTML-to-PDF/XLSX API:
turn HTML strings or public URLs into real documents from inside an agent
conversation.

Checked 2026-10-23: DocRaptor has no first-party MCP server and npm has no
MCP package under this name (only their generated OpenAPI client). See
`mcp/MISSING.md` for the log.

## Tools

| Tool | What it does |
|---|---|
| `docraptor_create_pdf` | render one PDF from `document_content` (HTML) or `document_url`; `test` defaults to **true** so nothing bills until you flip it |
| `docraptor_create_xlsx` | render one XLSX from HTML/CSV-ish content or a URL |
| `docraptor_create_xlsx_from_rows` | headers + rows → table HTML → XLSX, composed locally |
| `docraptor_create_report` | title + meta line + table → styled PDF report |
| `docraptor_create_async` | queue on the async API; returns `download_url` + `status_url` instead of bytes |
| `docraptor_async_status` | read an async job's `status_url` |
| `docraptor_async_fetch` | fetch a finished async job's presigned `download_url`; save or inline |
| `docraptor_create_production` | test=false render that spends credits — requires explicit `confirm: true` |
| `docraptor_test_ping` | render one tiny free test PDF as a health check |
| `docraptor_validate_html` | local HTML sanity checks (structure, tag balance, http:// assets) before spending a render |
| `docraptor_check_source_url` | GET a `document_url` once to confirm the renderer can reach it |

Output handling: pass `save_path` to write the file to disk; without it,
documents under 1 MB come back inline as base64 and bigger ones are refused
with the suggestion to use `save_path`. The async tools validate that the
URLs they fetch point back at `api.docraptor.com`.

## Auth

```sh
export DOCRAPTOR_API_KEY=...
```

HTTP Basic where the **username is the API key** and the password is empty,
per DocRaptor's docs. The key never travels in tool arguments.

## Run

```sh
cd mcp/servers/docraptor-mcp
npm install
npm run build
node dist/index.js        # stdio MCP server
npm test                  # unit tests (pure helpers)
python3 tools/smoke.py    # live check; renders one free test PDF
```

## Wire into OpenCode (`~/.config/opencode/opencode.jsonc`)

```jsonc
"docraptor": {
  "type": "local",
  "command": ["node", "/path/to/awesome-servers/mcp/servers/docraptor-mcp/dist/index.js"],
  "enabled": true,
  "environment": { "DOCRAPTOR_API_KEY": "..." },
  "timeout": 120000
}
```

## Honesty notes

- `test: true` documents are free and watermarked; `test: false` spends real
  credits. The default leans free on purpose.
- `javascript: true` and `prince_options` only apply to PDF rendering.
