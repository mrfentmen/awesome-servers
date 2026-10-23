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
| `docraptor_create_document` | render one document from `document_content` (HTML) or `document_url`; `test` defaults to **true** so nothing bills until you flip it |

Output handling: pass `save_path` to write the file to disk; without it,
documents under 1 MB come back inline as base64 and bigger ones are refused
with the suggestion to use `save_path`.

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
